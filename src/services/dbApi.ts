export interface PostgresEnvio {
  id: number;
  ojs_submission_id: number;
  titulo_articulo?: string;
  palabras_claves?: string;
  colaboradores?: string;
  revista_destino?: string;
  categoria: string;
  autor_email: string;
  created_at: string;
}

export interface PostgresCongress {
  id: number;
  nombre: string;
  descripcion: string;
  fecha_celebracion: string;
  sede: string;
  modalidad: string;
  nivel_academico: string;
  linea_investigacion: string;
  aula_canal: string;
  created_at: string;
  envios: PostgresEnvio[];
}

const API_BASE_URL = 'http://localhost:3001/api';

export const fetchDashboardData = async (): Promise<PostgresCongress[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/congresos`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    throw new Error(data.error || 'Error al obtener datos');
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('No se pudo conectar con el servidor local Node.js (Puerto 3001). Asegúrate de que está corriendo.');
  }
};
