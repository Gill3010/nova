import React, { createContext, useCallback, useContext, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TourContextType {
  /** Si el tour está corriendo actualmente */
  isActive: boolean;
  /** Si el tour fue completado (o saltado) en esta sesión */
  isCompleted: boolean;
  /** Iniciar el tour. `force = true` lo reinicia aunque ya haya sido completado */
  startTour: (force?: boolean) => void;
  /** Marcar el tour como completado */
  endTour: () => void;
  /** Marcar el tour como saltado (misma acción que completado a efectos de persistencia) */
  skipTour: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const TourContext = createContext<TourContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const startTour = useCallback((force = false) => {
    if (force) {
      setIsCompleted(false);
    }
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
  }, []);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
  }, []);

  return (
    <TourContext.Provider value={{ isActive, isCompleted, startTour, endTour, skipTour }}>
      {children}
    </TourContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook de consumo
// ─────────────────────────────────────────────────────────────────────────────

export const useTourContext = (): TourContextType => {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error('useTourContext debe usarse dentro de <TourProvider>');
  }
  return ctx;
};
