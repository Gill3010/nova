import type { DriveStep } from 'driver.js';

/**
 * Pasos del Product Tour para el rol Ponente (Speaker).
 *
 * Botones y elementos reales del SpeakerPage (/speaker/new):
 * - Selector "Seleccione el Congreso de Destino"
 * - Input "Título del Trabajo Académico"
 * - FileUploadCard "Manuscrito Completo" (limiteMB: 25)
 * - FileUploadCard "Afiche o Póster" (limiteMB: 15)
 * - Botón "Enviar y Sincronizar" (SubmissionStatusBar)
 * - Tab "Mis Envíos" → /speaker/history
 */
export const speakerTourSteps: DriveStep[] = [
  {
    element: '[data-tour-id="speaker-congress-selector"]',
    popover: {
      title: 'Selecciona el Congreso de Destino',
      description:
        'Elige el congreso al que enviarás tu ponencia. Solo aparecen los congresos activos registrados en el sistema.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="speaker-submission-title"]',
    popover: {
      title: 'Título del Trabajo Académico',
      description:
        'Escribe el título oficial de tu ponencia. Este título aparecerá en el programa del congreso y se sincronizará con OJS como metadato de la submission.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="speaker-file-manuscript"]',
    popover: {
      title: 'Manuscrito Completo',
      description:
        'Sube tu documento en PDF (máx. 25 MB). Es el archivo principal de tu ponencia y se adjuntará como galley en la submission de OJS.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="speaker-file-poster"]',
    popover: {
      title: 'Afiche o Póster',
      description:
        'Opcional. Sube el afiche visual de tu investigación en PNG o PDF (máx. 15 MB) para el tablón de exposición del congreso.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="speaker-submit-btn"]',
    popover: {
      title: 'Enviar y Sincronizar',
      description:
        'Cuando hayas completado los datos y subido los archivos, el botón <strong>«Enviar y Sincronizar»</strong> enviará tu ponencia y la registrará en OJS automáticamente. Puedes hacer seguimiento del estado en la pestaña <strong>Mis Envíos</strong>.',
      side: 'top',
      align: 'center',
    },
  },
];
