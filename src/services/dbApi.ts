export interface PostgresEnvio {
  id: number;
  ojs_submission_id: number;
  titulo_articulo?: string;
  resumen?: string;
  palabras_claves?: string;
  colaboradores?: string;
  revista_destino?: string;
  revista_ojs_id?: number;
  categoria: string;
  autor_email: string;
  created_at: string;
  nivel_academico?: string;
  linea_investigacion?: string;
  revista_path?: string;
  portal_url?: string;
  portal_api_key?: string;
}

export interface PostgresPortalOjs {
  portal_ojs_id: number;
  ojs_url: string;
  portal_nombre: string;
}

export interface PostgresCongress {
  id: number;
  creador_id?: number;
  nombre: string;
  lema?: string;
  descripcion: string;
  fecha_celebracion: string;
  fecha_finalizacion?: string;
  sede: string;
  modalidad: string;
  nivel_academico: string;
  linea_investigacion: string;
  aula_canal: string;
  ojs_url?: string;
  ojs_api_key?: string;
  ojs_journal_path?: string;
  ojs_submission_id?: number;
  ojs_publication_id?: number;
  estado?: string;
  created_at: string;
  envios: PostgresEnvio[];
  portales_ojs: PostgresPortalOjs[];
}

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

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
    throw error;
  }
};

export interface PostgresMySubmission {
  id: number;
  ojs_submission_id: number;
  ojs_publication_id?: number;
  titulo_articulo: string;
  resumen?: string;
  palabras_claves?: string;
  colaboradores?: string;
  categoria: string;
  created_at: string;
  congreso_id: number;
  congreso_nombre: string;
  revista_ojs_id?: number;
  revista_nombre?: string;
  revista_path?: string;
  revista_destino?: string;
  portal_url?: string;
  portal_api_key?: string;
  nivel_academico?: string;
  linea_investigacion?: string;
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
    throw error;
  }
};

export interface PostgresUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'organizer' | 'speaker' | 'attendee' | 'reviewer';
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
    throw error;
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

export const fetchEspacios = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/espacios`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching espacios:', error);
    throw error;
  }
};

export const createEspacio = async (espacioData: any): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/espacios`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(espacioData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al crear el espacio');
  }
  return response.json();
};

export const updateEspacio = async (id: number, espacioData: any): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/espacios/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(espacioData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al actualizar el espacio');
  }
  return response.json();
};

export const deleteEspacio = async (id: number): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/espacios/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al eliminar el espacio');
  }
  return response.json();
};

// --- Módulo de Actividades (Agenda) ---
export const fetchActividades = async (congresoId: number) => {
  const response = await fetch(`${API_BASE_URL}/actividades/congreso/${congresoId}`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Error al obtener actividades');
  return response.json();
};

export const createActividad = async (data: any) => {
  const response = await fetch(`${API_BASE_URL}/actividades`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al crear actividad');
  }
  return response.json();
};

export const updateActividad = async (id: number, data: any) => {
  const response = await fetch(`${API_BASE_URL}/actividades/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al actualizar actividad');
  }
  return response.json();
};

export const deleteActividad = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/actividades/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al eliminar actividad');
  }
  return response.json();
};

// --- Módulo de Portales OJS ---

export interface PortalOjsData {
  id: number;
  ojs_url: string;
  ojs_api_key: string;
  nombre: string;
  habilitado: boolean;
  revistas: {
    id: number;
    ojs_journal_path: string;
    ojs_journal_id?: number;
    nombre: string;
    url?: string;
    habilitada: boolean;
  }[];
}

export const fetchPortalesOjs = async (): Promise<PortalOjsData[]> => {
  const response = await fetch(`${API_BASE_URL}/portales-ojs`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Error al obtener portales OJS');
  const data = await response.json();
  return data.success ? data.data : [];
};

export const createPortalOjs = async (portalData: { ojs_url: string; ojs_api_key: string; nombre?: string; ojs_service_user?: string; ojs_service_password?: string }): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/portales-ojs`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(portalData)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al crear portal OJS');
  }
  return response.json();
};

export const syncRevistasPortal = async (portalId: number, revistas: any[]): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/portales-ojs/${portalId}/revistas`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ revistas })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al sincronizar revistas');
  }
  return response.json();
};

export const associatePortalToCongress = async (portalId: number, congresoId: number): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/portales-ojs/${portalId}/congresos/${congresoId}`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al asociar portal al congreso');
  }
  return response.json();
};

export const fetchRevistasForCongress = async (congresoId: number): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/portales-ojs/congreso/${congresoId}/revistas`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Error al obtener revistas del congreso');
  const data = await response.json();
  return data.success ? data.data : [];
};

export const updateCongressState = async (id: number, estado: string, token: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/congresos/${id}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ estado })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al actualizar el estado del congreso');
  }
  return response.json();
};

export const deleteCongress = async (id: number, token: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/congresos/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al eliminar el congreso');
  }
  return response.json();
};

export const fetchRevisorEnvios = async (): Promise<PostgresEnvio[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/usuarios/revisores/envios`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    throw new Error(data.error || 'Error al obtener envíos del revisor');
  } catch (error: any) {
    console.error('Error fetching reviewer envios:', error);
    throw error;
  }
};

export const assignRevisorEnvio = async (revisorId: number, envioId: number): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/usuarios/revisores/asignar`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ revisorId, envioId })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al asignar envío');
  }
  return response.json();
};

export const unassignRevisorEnvio = async (revisorId: number, envioId: number): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/usuarios/revisores/desasignar`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ revisorId, envioId })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al desasignar envío');
  }
  return response.json();
};

export const fetchRevisorAssignments = async (): Promise<{ revisor_id: number; envio_id: number }[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/usuarios/revisores/asignaciones`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    throw new Error(data.error || 'Error al obtener asignaciones');
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
};

export const submitEvaluation = async (evaluationData: {
  envioId: number;
  scoreScientific: number;
  scoreOriginality: number;
  scorePresentation: number;
  comments: string;
  approved: boolean;
}): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/usuarios/revisores/evaluar`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(evaluationData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al guardar la evaluación');
  }
  return response.json();
};

export const fetchEvaluation = async (envioId: number): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/usuarios/revisores/evaluaciones/${envioId}`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    throw new Error(data.error || 'Error al obtener la evaluación');
  } catch (error: any) {
    console.error('Error fetching evaluation:', error);
    throw error;
  }
};

// --- Módulo de Revisión Preliminar del Sistema ---

export interface SystemReport {
  id: number;
  envio_id: number;
  score_scientific: number | null;
  score_originality: number | null;
  score_presentation: number | null;
  comments: string | null;
  created_at: string;
}

/**
 * Obtiene el reporte preliminar del sistema (IA/Lambda) para un envío.
 * Retorna null si aún no se ha generado el reporte.
 */
export const fetchSystemReport = async (envioId: number): Promise<SystemReport | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/revisiones/sistema/${envioId}`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success) {
      return data.data; // null si no existe aún
    }
    throw new Error(data.error || 'Error al obtener el reporte del sistema');
  } catch (error: any) {
    console.error('Error fetching system report:', error);
    return null; // No bloquear el panel del revisor si el reporte no está disponible
  }
};

/**
 * URL para servir el archivo de un envío directamente desde Nova (sin OJS).
 * La usa el iframe en el panel del revisor.
 */
export const getEnvioArchivoUrl = (envioId: number): string =>
  `${API_BASE_URL}/envios/archivo/${envioId}`;

/**
 * Obtiene el archivo de un envío en formato Blob y retorna una URL local.
 * Esto evita problemas de autenticación en elementos como iframe.
 */
export const fetchEnvioArchivoBlobUrl = async (envioId: number): Promise<string> => {
  const token = localStorage.getItem('nova_token');
  const response = await fetch(getEnvioArchivoUrl(envioId), {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  if (!response.ok) {
    throw new Error('Error al obtener el archivo del servidor de Nova');
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

