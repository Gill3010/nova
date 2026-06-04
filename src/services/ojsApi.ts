import type { OjsJournal } from '../types';
import { getPortalBaseUrl } from '../utils/ojsUtils';

const getHeaders = (apiKey: string, portalUrl: string) => {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'x-ojs-base-url': portalUrl
  };
};

export const fetchJournals = async (ojsUrl: string, apiKey: string): Promise<OjsJournal[]> => {
  const portalUrl = getPortalBaseUrl(ojsUrl);
  const targetUrl = `/ojs-api/index.php/index/api/v1/contexts`;
  const headers = getHeaders(apiKey, portalUrl);

  const response = await fetch(targetUrl, {
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
  const targetUrl = `/ojs-api/index.php/${journalPath}/api/v1/submissions?count=1`;
  const headers = getHeaders(apiKey, portalUrl);

  const response = await fetch(targetUrl, {
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
  const targetUrl = `/ojs-api/index.php/${journalPath}/api/v1/submissions`;
  const headers = getHeaders(apiKey, portalUrl);

  const response = await fetch(targetUrl, {
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
  const targetUrl = `/ojs-api/index.php/${journalPath}/api/v1/submissions/${submissionId}/files`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileStage', fileStage);
  formData.append('genreId', genreId);

  const uploadHeaders = {
    'Authorization': `Bearer ${apiKey}`,
    'x-ojs-base-url': portalUrl
  };

  const response = await fetch(targetUrl, {
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
  const targetUrl = `/ojs-api/index.php/${journalPath}/api/v1/submissions/${submissionId}/publications/${publicationId}/galleys`;
  const headers = getHeaders(apiKey, portalUrl);

  const response = await fetch(targetUrl, {
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
  const targetUrl = `/ojs-api/index.php/${journalPath}/api/v1/issues?count=5`;
  const headers = getHeaders(apiKey, portalUrl);

  const response = await fetch(targetUrl, {
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
  const targetUrl = `/ojs-api/index.php/${journalPath}/api/v1/submissions/${submissionId}/publications/${publicationId}`;
  const headers = getHeaders(apiKey, portalUrl);

  const response = await fetch(targetUrl, {
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
    const targetUrl = `/ojs-api/index.php/${journalPath}/api/v1/submissions?count=1`;
    const headers = getHeaders(apiKey, portalUrl);
    const response = await fetch(targetUrl, { method: 'GET', headers });
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
  const targetUrl = `/ojs-api/index.php/${journalPath}/api/v1/submissions/${submissionId}/publications/${publicationId}/contributors`;
  const headers = getHeaders(apiKey, portalUrl);

  const response = await fetch(targetUrl, {
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
