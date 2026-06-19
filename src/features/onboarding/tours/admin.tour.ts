import type { DriveStep } from 'driver.js';

/**
 * Pasos del Product Tour para el rol Administrador.
 *
 * Referencias reales de la UI:
 * - Tab "Congresos" → /admin → formulario de creación/edición de congreso
 * - Sidebar derecho → Integración OJS 3.4 (OjsConfigCard)
 * - Tab "Espacios" → /espacios
 * - Tab "Agenda"   → /agenda
 * - Tab "Usuarios" → /users (solo admin)
 * - Header → botón "Mis Congresos" → /dashboard
 */
export const adminTourSteps: DriveStep[] = [
  {
    element: '[data-tour-id="admin-congress-create-btn"]',
    popover: {
      title: 'Formulario de Congreso',
      description:
        'Este es el formulario central. Aquí registras y editas todos los datos del congreso: nombre, fecha, sede, modalidad y roles habilitados. Los cambios se guardan al publicar en OJS.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="btn-nuevo-congreso"]',
    popover: {
      title: 'Nuevo Congreso',
      description:
        'Al terminar de crear o editar un congreso, usa el botón <strong>«Nuevo Congreso»</strong> para limpiar el formulario y comenzar con un nuevo registro sin tener que recargar la página.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour-id="admin-portal-ojs-section"]',
    popover: {
      title: 'Integración OJS 3.4',
      description:
        'Ingresa la URL base y el API Key del portal OJS. Usa el botón <strong>«Probar Conexión OJS»</strong> para verificar el acceso antes de publicar. Una vez conectado, el botón <strong>«Publicar en OJS»</strong> sincroniza el congreso como submission académica.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="admin-spaces-nav-link"]',
    popover: {
      title: 'Espacios',
      description:
        'En la pestaña <strong>Espacios</strong> registras aulas físicas y salas virtuales. Cada espacio puede asignarse a las actividades de la agenda del congreso.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="admin-agenda-nav-link"]',
    popover: {
      title: 'Agenda',
      description:
        'La pestaña <strong>Agenda</strong> te permite crear el programa de actividades: sesiones, paneles y conferencias. Asigna ponentes, horarios y espacios a cada actividad.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour-id="admin-users-nav-link"]',
    popover: {
      title: 'Usuarios',
      description:
        'Desde la pestaña <strong>Usuarios</strong> administras todos los registros: asignas roles (Ponente, Asistente, Organizador) y gestionas el acceso al sistema.',
      side: 'bottom',
      align: 'start',
    },
  },
];
