import type { ResearchLine, ClassroomInfo, UserRole } from '../types';

export const DEFAULT_RESEARCH_LINES: ResearchLine[] = [
  { id: '1', name: 'Innovación tecnológica y transformación digital', isCustom: false },
  { id: '2', name: 'Gestión del conocimiento y aprendizaje organizacional', isCustom: false },
  { id: '3', name: 'Derecho, gobernanza y políticas públicas', isCustom: false },
  { id: '4', name: 'Economía, finanzas y desarrollo sostenible', isCustom: false },
  { id: '5', name: 'Ciencias de la Salud y Biomedicina', isCustom: false },
  { id: '6', name: 'Educación, Pedagogía y Aprendizaje en la Era Digital', isCustom: false },
  { id: '7', name: 'Ciencias de la Tierra, Medio Ambiente y Cambio Climático', isCustom: false },
  { id: '8', name: 'Ingeniería, Manufactura y Materiales Avanzados', isCustom: false },
  { id: '9', name: 'Ciencias Básicas (Física, Química, Matemáticas)', isCustom: false },
  { id: '10', name: 'Ciencias Agropecuarias y Seguridad Alimentaria', isCustom: false }
];

export const PREDEFINED_CLASSROOMS: ClassroomInfo[] = [
  {
    id: 'a101',
    name: 'Aula A-101',
    building: 'Edificio A (Ciencias)',
    capacity: 45,
    equipment: ['Proyector HD', 'Pizarra Digital Interactiva', 'Audio premium'],
    type: 'fisica'
  },
  {
    id: 'a102',
    name: 'Aula A-102',
    building: 'Edificio A (Ciencias)',
    capacity: 40,
    equipment: ['Proyector HD', 'Pizarra tradicional', 'Aire acondicionado'],
    type: 'fisica'
  },
  {
    id: 'a103',
    name: 'Aula A-103',
    building: 'Edificio A (Ciencias)',
    capacity: 35,
    equipment: ['Pantalla Smart TV', 'Pizarra acrílica', 'Cámara de videoconferencia'],
    type: 'fisica'
  },
  {
    id: 'b201',
    name: 'Aula B-201',
    building: 'Edificio B (Postgrados)',
    capacity: 30,
    equipment: ['Proyector HD', 'Sistema de audio', 'Aire acondicionado', 'Mobiliario modular'],
    type: 'fisica'
  },
  {
    id: 'b202',
    name: 'Aula B-202',
    building: 'Edificio B (Postgrados)',
    capacity: 25,
    equipment: ['Pantalla Smart TV 75"', 'Cámara 360° para híbridos', 'Micrófonos ambientales'],
    type: 'fisica'
  },
  {
    id: 'b203',
    name: 'Aula B-203',
    building: 'Edificio B (Postgrados)',
    capacity: 50,
    equipment: ['Proyector Dual', 'Pizarra táctil', 'Sistema de traducción simultánea'],
    type: 'fisica'
  },
  {
    id: 'v101',
    name: 'Aula Virtual V-101 (Zoom)',
    building: 'Servidor Campus Virtual',
    capacity: 500,
    equipment: ['Transmisión HD', 'Grabación en la nube', 'Salas de grupos (Breakout Rooms)'],
    type: 'virtual'
  },
  {
    id: 'v102',
    name: 'Aula Virtual V-102 (Zoom)',
    building: 'Servidor Campus Virtual',
    capacity: 300,
    equipment: ['Transmisión HD', 'Soporte de votaciones', 'Subtítulos automáticos'],
    type: 'virtual'
  },
  {
    id: 'v103',
    name: 'Aula Virtual V-103 (Teams)',
    building: 'Servidor Office 365',
    capacity: 250,
    equipment: ['Pizarra compartida Teams', 'Transcripción en directo', 'Integración con MS Office'],
    type: 'virtual'
  }
];

export const DEFAULT_ROLES: UserRole[] = [
  { id: 'ponente', name: 'Ponente', description: 'Registra resúmenes/papers y expone la investigación en las sesiones asignadas.' },
  { id: 'revisor', name: 'Revisor', description: 'Realiza la revisión por pares ciegas de los trabajos científicos enviados.' },
  { id: 'asesor', name: 'Asesor', description: 'Acompaña a los estudiantes de posgrado en el rigor metodológico.' },
  { id: 'evaluador', name: 'Evaluador', description: 'Califica la presentación oral en vivo de los ponentes usando rúbricas del sistema.' },
  { id: 'organizador', name: 'Organizador', description: 'Coordina la logística general, asigna aulas y valida cronogramas del congreso.' },
  { id: 'editor', name: 'Editor', description: 'Compila las ponencias aprobadas y gestiona la exportación/sincronización con OJS.' },
  { id: 'asistente', name: 'Asistente', description: 'Participa como oyente en las ponencias, accede a los canales y recibe constancia de asistencia.' },
  { id: 'administrador', name: 'Administrador', description: 'Gestiona la configuración global de la plataforma, usuarios y la integración técnica del sistema.' }
];

export const LATIN_AMERICAN_UNIVERSITIES = [
  'Universidad Nacional Autónoma de México (UNAM) - México',
  'Tecnológico de Monterrey (ITESM) - México',
  'Universidade de São Paulo (USP) - Brasil',
  'Universidad de Buenos Aires (UBA) - Argentina',
  'Pontificia Universidad Católica de Chile (UC) - Chile',
  'Universidad de Chile - Chile',
  'Universidad de los Andes - Colombia',
  'Universidad Nacional de Colombia - Colombia',
  'Universidade Estadual de Campinas (Unicamp) - Brasil',
  'Universidad Federal de Rio de Janeiro (UFRJ) - Brasil',
  'Universidad de Costa Rica (UCR) - Costa Rica',
  'Universidad Central de Venezuela (UCV) - Venezuela',
  'Universidad Peruana Cayetano Heredia - Perú',
  'Universidad Nacional Mayor de San Marcos - Perú',
  'Pontificia Universidad Católica del Perú (PUCP) - Perú',
  'Universidad de la República (UdelaR) - Uruguay',
  'Universidad de El Salvador - El Salvador',
  'Universidad de San Carlos de Guatemala - Guatemala',
  'Universidad Nacional Autónoma de Honduras (UNAH) - Honduras',
  'Universidad de Panamá - Panamá',
  'Universidad San Francisco de Quito (USFQ) - Ecuador',
  'Escuela Politécnica Nacional - Ecuador',
  'Universidad de La Habana - Cuba',
  'Universidad Autónoma de Santo Domingo (UASD) - República Dominicana',
  'Universidad Nacional de Asunción (UNA) - Paraguay',
  'Universidad Mayor de San Andrés (UMSA) - Bolivia'
];
