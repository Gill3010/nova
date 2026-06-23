import { useCallback, useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import type { DriveStep, Driver } from 'driver.js';
import type { Role } from '../../../context/AuthContext';
import { useTourContext } from '../context/TourContext';
import { adminTourSteps } from '../tours/admin.tour';
import { organizerTourSteps } from '../tours/organizer.tour';
import { speakerTourSteps } from '../tours/speaker.tour';
import { attendeeTourSteps } from '../tours/attendee.tour';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de persistencia en localStorage
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'nova_tour_completed';

/**
 * Devuelve la clave de localStorage para un usuario y rol específicos.
 * Ejemplo: "nova_tour_completed_speaker_42"
 */
const buildStorageKey = (role: Role, userId: number): string =>
  `${STORAGE_KEY_PREFIX}_${role}_${userId}`;

const isTourCompleted = (role: Role, userId: number): boolean =>
  localStorage.getItem(buildStorageKey(role, userId)) === 'true';

const markTourCompleted = (role: Role, userId: number): void => {
  localStorage.setItem(buildStorageKey(role, userId), 'true');
};

const clearTourCompleted = (role: Role, userId: number): void => {
  localStorage.removeItem(buildStorageKey(role, userId));
};

// ─────────────────────────────────────────────────────────────────────────────
// Mapa de pasos por rol
// ─────────────────────────────────────────────────────────────────────────────

const TOUR_STEPS_BY_ROLE: Record<Role, DriveStep[]> = {
  admin: adminTourSteps,
  organizer: organizerTourSteps,
  speaker: speakerTourSteps,
  attendee: attendeeTourSteps,
  reviewer: [],
  editor: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────────────────────

interface UseTourOptions {
  role: Role;
  userId: number;
  /** Si es `true`, el tour se dispara automáticamente cuando la página carga (primer login). */
  autoStart?: boolean;
}

interface UseTourReturn {
  /** Inicia el tour manualmente. `force = true` ignora si ya fue completado. */
  startTour: (force?: boolean) => void;
  /** Indica si el tour ya fue completado para este usuario/rol */
  alreadyCompleted: boolean;
}

export const useTour = ({
  role,
  userId,
  autoStart = false,
}: UseTourOptions): UseTourReturn => {
  const { startTour: ctxStart, endTour, skipTour } = useTourContext();
  const driverRef = useRef<Driver | null>(null);
  const alreadyCompleted = isTourCompleted(role, userId);

  /**
   * Filtra los pasos cuyo elemento objetivo existe en el DOM.
   * Evita que Driver.js lance un error si un `data-tour-id` no está montado todavía.
   */
  const getAvailableSteps = useCallback((steps: DriveStep[]): DriveStep[] => {
    return steps.filter((step) => {
      const selector = (step.element as string) ?? '';
      return selector ? !!document.querySelector(selector) : true;
    });
  }, []);

  const initDriver = useCallback((): Driver => {
    const driverInstance = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(0,0,0,0.55)',
      stagePadding: 6,
      stageRadius: 8,
      allowClose: true,
      // Textos en español
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Anterior',
      doneBtnText: '¡Listo! ✓',
      progressText: 'Paso {{current}} de {{total}}',
      popoverClass: 'nova-tour-popover',
      onDestroyStarted: () => {
        // Driver.js llama esto cuando el usuario hace clic en X o "Done"
        const isLastStep =
          driverInstance.getActiveIndex() ===
          (driverInstance.getConfig().steps?.length ?? 0) - 1;

        if (isLastStep || !driverInstance.isActive()) {
          // Tour completado naturalmente
          markTourCompleted(role, userId);
          endTour();
        } else {
          // Tour saltado a mitad
          markTourCompleted(role, userId);
          skipTour();
        }
        driverInstance.destroy();
      },
    });

    return driverInstance;
  }, [role, userId, endTour, skipTour]);

  const startTour = useCallback(
    (force = false) => {
      // Si ya fue completado y no se fuerza, no hacer nada
      if (!force && isTourCompleted(role, userId)) return;

      // Si se fuerza, borrar el flag de localStorage
      if (force) {
        clearTourCompleted(role, userId);
      }

      const steps = getAvailableSteps(TOUR_STEPS_BY_ROLE[role]);

      if (steps.length === 0) {
        console.warn(
          `[useTour] No se encontraron elementos en el DOM para el tour del rol "${role}". ` +
            'Asegúrate de que los data-tour-id estén montados antes de llamar startTour().'
        );
        return;
      }

      // Destruir instancia previa si existe
      if (driverRef.current?.isActive()) {
        driverRef.current.destroy();
      }

      const driverInstance = initDriver();
      driverInstance.setSteps(steps);
      driverRef.current = driverInstance;

      ctxStart(force);
      driverInstance.drive();
    },
    [role, userId, getAvailableSteps, initDriver, ctxStart]
  );

  // ── Auto-start en primer login ──────────────────────────────────────────────
  useEffect(() => {
    if (!autoStart) return;
    if (isTourCompleted(role, userId)) return;

    // Pequeño delay para que el DOM esté completamente renderizado
    const timeout = setTimeout(() => {
      startTour(false);
    }, 800);

    return () => {
      clearTimeout(timeout);
      if (driverRef.current?.isActive()) {
        driverRef.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, userId, autoStart]);

  return { startTour, alreadyCompleted };
};
