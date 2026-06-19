import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTour } from '../hooks/useTour';

// ─────────────────────────────────────────────────────────────────────────────
// Estilos del popover de Driver.js
//
// Diseño alineado al sistema institucional del proyecto:
// - Paleta: zinc-900 (fondo), zinc-100 (texto), zinc-700 (bordes)
// - Tipografía: system-ui igual que el resto del sistema
// - Botón primario: bg-zinc-100 text-zinc-900 (mismo que Button variant="primary" en dark)
// - Botón secundario: bg-zinc-800 text-zinc-300 (mismo que Button variant="ghost" en dark)
// - Sin emojis, sin gradientes, sin colores llamativos
// ─────────────────────────────────────────────────────────────────────────────

const TOUR_STYLES = `
  /* ── Overlay ─────────────────────────────────────────────────────── */
  .driver-overlay {
    backdrop-filter: blur(1px);
  }

  /* ── Popover contenedor ───────────────────────────────────────────── */
  .nova-tour-popover.driver-popover {
    background: #18181b;
    border: 1px solid #3f3f46;
    border-radius: 10px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.04);
    padding: 18px 20px 14px;
    max-width: 320px;
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* ── Título ───────────────────────────────────────────────────────── */
  .nova-tour-popover .driver-popover-title {
    font-size: 13.5px;
    font-weight: 700;
    color: #f4f4f5;
    margin-bottom: 6px;
    line-height: 1.35;
    letter-spacing: -0.01em;
  }

  /* ── Descripción ──────────────────────────────────────────────────── */
  .nova-tour-popover .driver-popover-description {
    font-size: 12.5px;
    color: #a1a1aa;
    line-height: 1.65;
  }

  .nova-tour-popover .driver-popover-description strong {
    color: #e4e4e7;
    font-weight: 600;
  }

  .nova-tour-popover .driver-popover-description em {
    color: #d4d4d8;
    font-style: normal;
  }

  /* ── Progreso ─────────────────────────────────────────────────────── */
  .nova-tour-popover .driver-popover-progress-text {
    font-size: 10.5px;
    color: #52525b;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* ── Footer ───────────────────────────────────────────────────────── */
  .nova-tour-popover .driver-popover-footer {
    margin-top: 14px;
    gap: 6px;
  }

  .nova-tour-popover .driver-popover-footer button {
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 12px;
    cursor: pointer;
    transition: background 0.12s ease, color 0.12s ease;
    border: none;
    letter-spacing: 0.01em;
  }

  /* Botón Anterior — ghost pattern del sistema */
  .nova-tour-popover .driver-popover-prev-btn {
    background: #27272a;
    color: #71717a;
    border: 1px solid #3f3f46;
  }
  .nova-tour-popover .driver-popover-prev-btn:hover {
    background: #3f3f46;
    color: #d4d4d8;
  }

  /* Botón Siguiente / Listo — primary pattern del sistema (zinc-100 / dark) */
  .nova-tour-popover .driver-popover-next-btn {
    background: #f4f4f5;
    color: #18181b;
    border: 1px solid transparent;
  }
  .nova-tour-popover .driver-popover-next-btn:hover {
    background: #e4e4e7;
  }

  /* Botón cerrar (X) */
  .nova-tour-popover .driver-popover-close-btn {
    color: #52525b;
    background: transparent;
    border: none;
    transition: color 0.12s;
  }
  .nova-tour-popover .driver-popover-close-btn:hover {
    color: #a1a1aa;
  }

  /* ── Flecha del popover ───────────────────────────────────────────── */
  .nova-tour-popover.driver-popover-side-top .driver-popover-arrow::before,
  .nova-tour-popover .driver-popover-arrow-side-top.driver-popover-arrow::before {
    border-top-color: #18181b;
  }
  .nova-tour-popover.driver-popover-side-bottom .driver-popover-arrow::before,
  .nova-tour-popover .driver-popover-arrow-side-bottom.driver-popover-arrow::before {
    border-bottom-color: #18181b;
  }
  .nova-tour-popover.driver-popover-side-left .driver-popover-arrow::before,
  .nova-tour-popover .driver-popover-arrow-side-left.driver-popover-arrow::before {
    border-left-color: #18181b;
  }
  .nova-tour-popover.driver-popover-side-right .driver-popover-arrow::before,
  .nova-tour-popover .driver-popover-arrow-side-right.driver-popover-arrow::before {
    border-right-color: #18181b;
  }

  /* ── Highlight del elemento activo ───────────────────────────────── */
  .driver-active-element {
    border-radius: 6px;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

interface TourLauncherProps {
  /**
   * 'button' → enlace inline (para menus de perfil/ayuda)
   * 'fab'    → botón flotante fijo en esquina inferior derecha
   */
  variant?: 'button' | 'fab';
  className?: string;
}

export const TourLauncher: React.FC<TourLauncherProps> = ({
  variant = 'button',
  className = '',
}) => {
  const { user } = useAuth();

  const { startTour } = useTour({
    role: user?.rol ?? 'attendee',
    userId: user?.id ?? 0,
    autoStart: false,
  });

  if (!user) return null;

  const handleClick = () => startTour(true);

  // ── Variante FAB ───────────────────────────────────────────────────────────
  if (variant === 'fab') {
    return (
      <>
        <style>{TOUR_STYLES}</style>
        <button
          id="tour-launcher-fab"
          onClick={handleClick}
          title="Ver tutorial de nuevo"
          aria-label="Iniciar tour interactivo"
          className={`
            fixed bottom-6 right-6 z-40
            inline-flex items-center gap-2
            bg-zinc-900 hover:bg-zinc-700
            dark:bg-zinc-100 dark:hover:bg-zinc-200
            text-white dark:text-zinc-900
            text-xs font-semibold
            px-3.5 py-2 rounded-md
            shadow-md
            transition-colors duration-150
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500
            ${className}
          `}
        >
          <HelpCircle
            className="h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
          <span className="hidden sm:inline">Ver tutorial</span>
        </button>
      </>
    );
  }


  // ── Variante Button inline ─────────────────────────────────────────────────
  return (
    <>
      <style>{TOUR_STYLES}</style>
      <button
        id="tour-launcher-btn"
        onClick={handleClick}
        aria-label="Iniciar tour interactivo"
        className={`
          inline-flex items-center gap-1.5
          text-xs font-medium
          text-zinc-500 dark:text-zinc-400
          hover:text-zinc-700 dark:hover:text-zinc-200
          transition-colors duration-150
          ${className}
        `}
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Ver tutorial de nuevo
      </button>
    </>
  );
};
