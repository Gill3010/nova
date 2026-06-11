import type { DriveStep } from 'driver.js';

/**
 * Pasos del Product Tour para el rol Asistente (Attendee).
 *
 * Flujo real en AttendeePage (/attendee):
 * - Si no hay congreso seleccionado: botón "Ver Directorio de Eventos" → /directorio
 * - Si hay congreso: sección de información del evento → itinerario → formulario de inscripción
 *
 * Navegación desde el Header:
 * - Botón "Directorio" → /directorio  (CalendarDays icon)
 * - Tab "Ticket e Itinerario (Público)" → /attendee
 *
 * Elementos reales con data-tour-id en AttendeePage:
 * - attendee-info-card    → Card de información general del congreso
 * - attendee-agenda-card  → Card del itinerario dinámico
 * - attendee-payment-form → Formulario de inscripción con botón "Realizar Pago Seguro"
 */
export const attendeeTourSteps: DriveStep[] = [
  {
    element: '[data-tour-id="attendee-program-tab"]',
    popover: {
      title: 'Ticket e Itinerario',
      description:
        'Esta pestaña muestra el itinerario público del congreso. Para verla, primero selecciona un evento desde el <strong>Directorio</strong> usando el botón «Directorio» en la barra superior.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="attendee-info-card"]',
    popover: {
      title: 'Información del Evento',
      description:
        'Aquí encuentras los datos generales del congreso: nombre, descripción, fechas, modalidad y sedes asignadas. Esta información es de solo lectura.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="attendee-agenda-card"]',
    popover: {
      title: 'Itinerario Dinámico',
      description:
        'El programa oficial del congreso con todas las actividades, horarios y espacios. Puedes filtrar por día y ver los detalles de cada sesión.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="attendee-payment-form"]',
    popover: {
      title: 'Inscripción y Acceso Oficial',
      description:
        'Completa los datos de tu tarjeta y haz clic en <strong>«Realizar Pago Seguro»</strong> para registrar tu participación. Al confirmar el pago recibirás tu ticket digital con código QR de acceso.',
      side: 'top',
      align: 'center',
    },
  },
];
