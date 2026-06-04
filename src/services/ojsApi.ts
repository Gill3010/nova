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
