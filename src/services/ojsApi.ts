import type { OjsJournal } from '../types';
import { getPortalBaseUrl } from '../utils/ojsUtils';

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';
const PROXY_URL = `${API_BASE_URL}/ojs-proxy`;

const getHeaders = (apiKey: string, targetOjsUrl: string) => {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'x-ojs-target-url': targetOjsUrl
  };
};

export const fetchJournals = async (ojsUrl: string, apiKey: string): Promise<OjsJournal[]> => {
  const portalUrl = getPortalBaseUrl(ojsUrl);
  const targetOjsUrl = `${portalUrl}/index.php/index/api/v1/contexts`;
  const headers = getHeaders(apiKey, targetOjsUrl);

  const response = await fetch(PROXY_URL, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const items = data.items || [];

  return items.map((item: any) => ({
    id: item.id,
    name: item.name?.es || item.name?.en || Object.values(item.name || {})[0] || `Revista ID ${item.id}`,
    nameObj: item.name || {},
    urlPath: item.urlPath,
    url: item.url || `${portalUrl}/index.php/${item.urlPath}`,
    enabled: item.enabled !== false
  }));
};

export const fetchSectionId = async (ojsUrl: string, apiKey: string, journalPath: string): Promise<number> => {
  const portalUrl = getPortalBaseUrl(ojsUrl);
  const targetOjsUrl = `${portalUrl}/index.php/${journalPath}/api/v1/submissions?count=1`;
  const headers = getHeaders(apiKey, targetOjsUrl);

  const response = await fetch(PROXY_URL, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const firstItem = data?.items?.[0];
  const extractedSectionId = firstItem?.publications?.[0]?.sectionId;

  if (extractedSectionId) {
    return extractedSectionId;
  }

  throw new Error('No sectionId found in recent submissions');
};

export const createSubmission = async (
  ojsUrl: string,
  apiKey: string,
  journalPath: string,
  payload: any
): Promise<any> => {
  const portalUrl = getPortalBaseUrl(ojsUrl);
  const targetOjsUrl = `${portalUrl}/index.php/${journalPath}/api/v1/submissions`;
  const headers = getHeaders(apiKey, targetOjsUrl);

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let responseData: any;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = responseText;
  }

  if (!response.ok) {
    throw {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    };
  }

  return responseData;
};

export const uploadSubmissionFile = async (
  ojsUrl: string,
  apiKey: string,
  journalPath: string,
  submissionId: number,
  file: File,
  fileStage: string = '2',
  genreId: string = '2'
): Promise<any> => {
  const portalUrl = getPortalBaseUrl(ojsUrl);
  const targetOjsUrl = `${portalUrl}/index.php/${journalPath}/api/v1/submissions/${submissionId}/files`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileStage', fileStage);
  formData.append('genreId', genreId);

  const uploadHeaders = {
    'Authorization': `Bearer ${apiKey}`,
    'x-ojs-target-url': targetOjsUrl
  };

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: uploadHeaders,
    body: formData
  });

  const responseText = await response.text();
  let responseData: any;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = responseText;
  }

  if (!response.ok) {
    throw {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    };
  }

  return responseData;
};

export const createGalley = async (
  ojsUrl: string,
  apiKey: string,
  journalPath: string,
  submissionId: number,
  publicationId: number,
  payload: any
): Promise<any> => {
  const portalUrl = getPortalBaseUrl(ojsUrl);
  const targetOjsUrl = `${portalUrl}/index.php/${journalPath}/api/v1/submissions/${submissionId}/publications/${publicationId}/galleys`;
  const headers = getHeaders(apiKey, targetOjsUrl);

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let responseData: any;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = responseText;
  }

  if (!response.ok) {
    throw {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    };
  }

  return responseData;
};

export const fetchIssues = async (
  ojsUrl: string,
  apiKey: string,
  journalPath: string
): Promise<any> => {
  const portalUrl = getPortalBaseUrl(ojsUrl);
  const targetOjsUrl = `${portalUrl}/index.php/${journalPath}/api/v1/issues?count=5`;
  const headers = getHeaders(apiKey, targetOjsUrl);

  const response = await fetch(PROXY_URL, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const updatePublication = async (
  ojsUrl: string,
  apiKey: string,
  journalPath: string,
  submissionId: number,
  publicationId: number,
  payload: any
): Promise<any> => {
  const portalUrl = getPortalBaseUrl(ojsUrl);
  const targetOjsUrl = `${portalUrl}/index.php/${journalPath}/api/v1/submissions/${submissionId}/publications/${publicationId}`;
  const headers = getHeaders(apiKey, targetOjsUrl);

  const response = await fetch(PROXY_URL, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let responseData: any;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = responseText;
  }

  if (!response.ok) {
    throw {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    };
  }

  return responseData;
};

// Obtiene el user_group_id del rol "Autor" (role_id=65536) para una revista específica
// consultando una submission reciente de esa revista para detectar el ID dinámicamente
export const fetchUserGroupId = async (
  ojsUrl: string,
  apiKey: string,
  journalPath: string,
  contextId: number
): Promise<number> => {
  // Mapa de fallback basado en los datos reales del servidor (context_id -> user_group_id del Autor)
  const fallbackMap: Record<number, number> = {
    1: 14, 2: 31, 3: 48, 4: 65, 5: 82, 6: 99, 7: 116
  };

  try {
    const portalUrl = getPortalBaseUrl(ojsUrl);
    const targetOjsUrl = `${portalUrl}/index.php/${journalPath}/api/v1/submissions?count=1`;
    const headers = getHeaders(apiKey, targetOjsUrl);
    const response = await fetch(PROXY_URL, { method: 'GET', headers });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    const firstSub = data?.items?.[0];
    const firstContrib = firstSub?.publications?.[0]?.authors?.[0];
    if (firstContrib?.userGroupId) return firstContrib.userGroupId;
  } catch {
    // si falla, usamos el mapa de fallback
  }

  return fallbackMap[contextId] ?? 14;
};

// Agrega un colaborador/autor a una publicación en OJS
export const addContributor = async (
  ojsUrl: string,
  apiKey: string,
  journalPath: string,
  submissionId: number,
  publicationId: number,
  payload: any
): Promise<any> => {
  const portalUrl = getPortalBaseUrl(ojsUrl);
  const targetOjsUrl = `${portalUrl}/index.php/${journalPath}/api/v1/submissions/${submissionId}/publications/${publicationId}/contributors`;
  const headers = getHeaders(apiKey, targetOjsUrl);

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let responseData: any;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = responseText;
  }

  if (!response.ok) {
    throw { status: response.status, statusText: response.statusText, data: responseData };
  }

  return responseData;
};

export const fetchSubmission = async (
  ojsUrl: string,
  apiKey: string,
  journalPath: string,
  submissionId: number
): Promise<any> => {
  const portalUrl = getPortalBaseUrl(ojsUrl);
  const targetOjsUrl = `${portalUrl}/index.php/${journalPath}/api/v1/submissions/${submissionId}`;
  const headers = getHeaders(apiKey, targetOjsUrl);

  const response = await fetch(PROXY_URL, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const deleteContributor = async (
  ojsUrl: string,
  apiKey: string,
  journalPath: string,
  submissionId: number,
  publicationId: number,
  contributorId: number
): Promise<any> => {
  const portalUrl = getPortalBaseUrl(ojsUrl);
  const targetOjsUrl = `${portalUrl}/index.php/${journalPath}/api/v1/submissions/${submissionId}/publications/${publicationId}/contributors/${contributorId}`;
  const headers = getHeaders(apiKey, targetOjsUrl);

  const response = await fetch(PROXY_URL, {
    method: 'DELETE',
    headers
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();
  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
};

export const deleteSubmission = async (
  ojsUrl: string,
  apiKey: string,
  journalPath: string,
  submissionId: number
): Promise<any> => {
  const portalUrl = getPortalBaseUrl(ojsUrl);
  const targetOjsUrl = `${portalUrl}/index.php/${journalPath}/api/v1/submissions/${submissionId}`;
  const headers = getHeaders(apiKey, targetOjsUrl);

  const response = await fetch(PROXY_URL, {
    method: 'DELETE',
    headers
  });

  if (!response.ok) {
    const responseText = await response.text();
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    throw {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    };
  }

  const responseText = await response.text();
  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
};

/**
 * Extrae un mensaje de error legible de una respuesta JSON de OJS.
 * OJS puede usar distintos campos: error, errorMessage, content.
 */
const extractOjsErrorMessage = (json: any, httpStatus?: number): string => {
  const parts: string[] = [];

  if (httpStatus) {
    parts.push(`HTTP ${httpStatus}`);
  }

  // OJS 3.x usa "error" (string o clave i18n como "api.submissions.403.unauthorized")
  if (json.error) {
    parts.push(`error="${json.error}"`);
  }
  // Algunos endpoints usan "errorMessage" con texto descriptivo
  if (json.errorMessage) {
    parts.push(`errorMessage="${json.errorMessage}"`);
  }
  // El proxy a veces reenvía el cuerpo en "content"
  if (json.content && json.content !== json.error) {
    parts.push(`content="${json.content}"`);
  }

  if (parts.length === 0) {
    return `Respuesta inesperada de OJS: ${JSON.stringify(json).substring(0, 300)}`;
  }
  return parts.join(' — ');
};

export const fetchSubmissionFiles = async (
  ojsUrl: string,
  apiKey: string,
  journalPath: string,
  submissionId: number
): Promise<any> => {
  const portalUrl = getPortalBaseUrl(ojsUrl);
  const targetOjsUrl = `${portalUrl}/index.php/${journalPath}/api/v1/submissions/${submissionId}/files`;
  const headers = getHeaders(apiKey, targetOjsUrl);

  // 🔍 DIAGNOSTIC LOG — TEMPORARY
  console.log('[OJS-DIAG] fetchSubmissionFiles REQUEST:', {
    targetOjsUrl,
    proxyUrl: PROXY_URL,
    headers: { ...headers, Authorization: headers.Authorization?.substring(0, 20) + '...' },
  });

  const response = await fetch(`${PROXY_URL}?_t=${Date.now()}`, {
    method: 'GET',
    headers
  });

  // 🔍 DIAGNOSTIC LOG — TEMPORARY: raw response info
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((val, key) => { responseHeaders[key] = val; });
  console.log('[OJS-DIAG] fetchSubmissionFiles RESPONSE:', {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    // 🔍 DIAGNOSTIC LOG — TEMPORARY
    console.error('[OJS-DIAG] fetchSubmissionFiles ERROR BODY:', errorBody);
    let errorDetail = '';
    try {
      const errorJson = JSON.parse(errorBody);
      errorDetail = ` — ${extractOjsErrorMessage(errorJson, response.status)}`;
    } catch {
      errorDetail = errorBody ? ` — ${errorBody.substring(0, 500)}` : '';
    }
    throw new Error(`HTTP Error ${response.status} ${response.statusText}${errorDetail}`);
  }

  // Incluso con 200, verificar si OJS devolvió un JSON de error (proxy transparente)
  const data = await response.json();

  // 🔍 DIAGNOSTIC LOG — TEMPORARY: full parsed response
  console.log('[OJS-DIAG] fetchSubmissionFiles PARSED DATA:', JSON.stringify(data, null, 2)?.substring(0, 2000));

  if (data && typeof data === 'object' && (data.error || data.errorMessage)) {
    throw new Error(`OJS respondió con error: ${extractOjsErrorMessage(data, response.status)}`);
  }

  return data;
};

export const downloadFileAsBlobUrl = async (
  apiKey: string,
  fileUrl: string
): Promise<string> => {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'x-ojs-target-url': fileUrl
  };

  // 🔍 DIAGNOSTIC LOG — TEMPORARY
  console.log('[OJS-DIAG] downloadFileAsBlobUrl REQUEST:', {
    fileUrl,
    proxyUrl: PROXY_URL,
  });

  const response = await fetch(`${PROXY_URL}?_t=${Date.now()}`, {
    method: 'GET',
    headers
  });

  // 🔍 DIAGNOSTIC LOG — TEMPORARY: raw response info
  const contentType = response.headers.get('content-type');
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((val, key) => { responseHeaders[key] = val; });
  console.log('[OJS-DIAG] downloadFileAsBlobUrl RESPONSE:', {
    status: response.status,
    statusText: response.statusText,
    contentType,
    headers: responseHeaders,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    // 🔍 DIAGNOSTIC LOG — TEMPORARY
    console.error('[OJS-DIAG] downloadFileAsBlobUrl ERROR BODY:', errorBody?.substring(0, 1000));
    let errorDetail = '';
    try {
      const errorJson = JSON.parse(errorBody);
      errorDetail = extractOjsErrorMessage(errorJson, response.status);
    } catch {
      errorDetail = `HTTP ${response.status} ${response.statusText}`;
    }
    throw new Error(`Error al descargar archivo de OJS: ${errorDetail}`);
  }

  // Si el proxy devolvió 200 pero el body es JSON, OJS envió un error enmascarado
  if (contentType && contentType.includes('application/json')) {
    const errorJson = await response.json();
    // 🔍 DIAGNOSTIC LOG — TEMPORARY
    console.error('[OJS-DIAG] downloadFileAsBlobUrl JSON-MASKED-ERROR:', JSON.stringify(errorJson, null, 2));
    const errorMsg = extractOjsErrorMessage(errorJson, response.status);
    throw new Error(`OJS denegó acceso al archivo: ${errorMsg}`);
  }

  // 🔍 DIAGNOSTIC LOG — TEMPORARY
  console.log('[OJS-DIAG] downloadFileAsBlobUrl SUCCESS — got blob, contentType:', contentType);

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
