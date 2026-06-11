import type { DriveStep } from 'driver.js';

/**
 * Pasos del Product Tour para el rol Organizador.
 *
 * El organizador ve las mismas pestañas que el Admin excepto "Usuarios".
 * Su flujo principal: crear congreso → conectar OJS → diseñar agenda.
 */
export const organizerTourSteps: DriveStep[] = [
  {
    element: '[data-tour-id="admin-congress-create-btn"]',
    popover: {
      title: 'Formulario de Congreso',
      description:
        'Aquí registras los datos del congreso: nombre, lema, descripción, fechas, sede y modalidad. También seleccionas los roles de usuario que estarán habilitados.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="btn-nuevo-congreso"]',
    popover: {
      title: 'Nuevo Congreso',
      description:
        'Cuando termines de crear un congreso, usa <strong>«Nuevo Congreso»</strong> para limpiar el formulario y registrar uno nuevo sin recargar la página.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour-id="admin-portal-ojs-section"]',
    popover: {
      title: 'Integración OJS 3.4',
      description:
        'Conecta el congreso con una revista de OJS para publicar los trabajos académicos. Ingresa la URL y el API Key, luego usa <strong>«Probar Conexión OJS»</strong> y finalmente <strong>«Publicar en OJS»</strong>.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="admin-spaces-nav-link"]',
    popover: {
      title: 'Espacios',
      description:
        'Registra las aulas y salas donde se realizarán las actividades. Puedes definir espacios físicos con ubicación y capacidad, o virtuales con enlace de videoconferencia.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="admin-agenda-nav-link"]',
    popover: {
      title: 'Agenda',
      description:
        'Diseña el programa completo del congreso. Añade sesiones, asigna horarios y vincula ponentes y espacios a cada actividad del evento.',
      side: 'bottom',
      align: 'start',
    },
  },
];
