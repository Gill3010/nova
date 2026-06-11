/**
 * Barrel export del módulo onboarding.
 *
 * Importa desde aquí en lugar de las rutas internas para mantener
 * el API pública del módulo estable y facilitar refactoring.
 *
 * @example
 * import { TourProvider, TourLauncher, useTour } from '../features/onboarding';
 */

export { TourProvider, useTourContext } from './context/TourContext';
export { useTour } from './hooks/useTour';
export { TourLauncher } from './components/TourLauncher';
