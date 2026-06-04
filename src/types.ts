export interface Congress {
  name: string;
  description: string;
  date: string;
  venue: string;
  modality: 'presencial' | 'virtual' | 'hibrida';
  classroom: string;
  academicLevel: 'maestria' | 'doctorado' | 'otros';
  researchLine: string;
  roles: string[];
}

export interface ResearchLine {
  id: string;
  name: string;
  isCustom: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
}

export interface OjsConfig {
  baseUrl: string;
  apiKey: string;
}

export interface Contributor {
  givenName: string;    // Nombre(s)
  familyName: string;   // Apellido(s)
  email: string;        // Correo electrónico (requerido por OJS)
  country: string;      // Código de país ISO 2 letras, ej: 'PA', 'CO', 'MX'
  affiliation: string;  // Institución o Universidad
}

export interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'request' | 'response' | 'error';
  message: string;
  payload?: any;
}

export interface FileInfo {
  name: string;
  size: number; // en MB
  type: string;
  progress: number; // 0 a 100
  rawFile?: File; // Objeto de archivo real para integración real
}

export interface Submission {
  id: string;
  title: string;
  category: 'poster' | 'libro' | 'articulo';
  researchLine: string;
  audioFile: FileInfo | null;
  posterFile: FileInfo | null;
  abstractFile: FileInfo | null;
  manuscriptFile: FileInfo | null;
  videoFile: FileInfo | null;
  status: 'draft' | 'submitted' | 'reviewed';
}

export interface Evaluation {
  scoreScientific: number; // 1-10
  scoreOriginality: number; // 1-10
  scorePresentation: number; // 1-10
  comments: string;
  approved: boolean;
}

export interface OjsJournal {
  id: number;
  name: string;
  nameObj: any;
  urlPath: string;
  url: string;
  enabled: boolean;
}

export interface ClassroomInfo {
  id: string;
  name: string;
  building: string;
  capacity: number;
  equipment: string[];
  type: 'fisica' | 'virtual';
}

