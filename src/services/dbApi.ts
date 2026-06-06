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
  ojs_url?: string;
  ojs_api_key?: string;
  ojs_journal_path?: string;
  created_at: string;
  envios: PostgresEnvio[];
}

const API_BASE_URL = 'http://localhost:3001/api';

const getHeaders = () => {
  const token = localStorage.getItem('nova_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const fetchDashboardData = async (scope?: 'all' | 'mine'): Promise<PostgresCongress[]> => {
  try {
    const url = scope ? `${API_BASE_URL}/congresos?scope=${scope}` : `${API_BASE_URL}/congresos`;
    const response = await fetch(url, {
      headers: getHeaders()
    });
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

export interface PostgresMySubmission {
  id: number;
  ojs_submission_id: number;
  titulo_articulo: string;
  palabras_claves?: string;
  colaboradores?: string;
  categoria: string;
  created_at: string;
  congreso_id: number;
  congreso_nombre: string;
}

export const saveCongress = async (congressData: any, token: string) => {
  const response = await fetch(`${API_BASE_URL}/congresos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(congressData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al guardar el congreso en la base de datos local');
  }
  
  return response.json();
};

export const updateCongress = async (id: number, congressData: any, token: string) => {
  const response = await fetch(`${API_BASE_URL}/congresos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(congressData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al actualizar el congreso en la base de datos local');
  }
  
  return response.json();
};

export const updateSubmission = async (id: number, submissionData: any, token: string) => {
  const response = await fetch(`${API_BASE_URL}/envios/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(submissionData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al actualizar la ponencia en la base de datos local');
  }
  
  return response.json();
};

export const fetchMySubmissions = async (): Promise<PostgresMySubmission[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/envios/me`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    throw new Error(data.error || 'Error al obtener envíos');
  } catch (error: any) {
    console.error('Error fetching my submissions:', error);
    throw new Error('No se pudo conectar con el servidor local');
  }
};

export interface PostgresUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'organizer' | 'speaker';
  is_active: boolean;
  created_at: string;
}

export const fetchUsers = async (): Promise<PostgresUser[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    throw new Error(data.error || 'Error al obtener usuarios');
  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw new Error('No se pudo conectar con el servidor local');
  }
};

export const updateUserRole = async (id: number, rol: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/usuarios/${id}/rol`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ rol })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al actualizar el rol');
  }
  
  return response.json();
};

export const toggleUserStatus = async (id: number, isActive: boolean): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/usuarios/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ is_active: isActive })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al actualizar el estado del usuario');
  }
  
  return response.json();
};
