import { useState, useCallback } from 'react';
import type { OjsJournal } from '../types';
import * as ojsApi from '../services/ojsApi';
import type { useOjsLogs } from './useOjsLogs';

type LogFn = ReturnType<typeof useOjsLogs>['addLog'];

/**
 * Manages OJS connection state: URL, API key, connection test, journal list.
 * Extracted from useOjsIntegration for single responsibility.
 */
export function useOjsConnection(addLog: LogFn) {
  const [ojsUrl, setOjsUrl] = useState('');
  const [ojsApiKey, setOjsApiKey] = useState('');
  const [ojsStatus, setOjsStatus] = useState<'disconnected' | 'connected'>('disconnected');
  const [journals, setJournals] = useState<OjsJournal[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<OjsJournal | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const testOjsConnection = useCallback(async () => {
    if (isTestingConnection) return;
    setIsTestingConnection(true);
    setOjsStatus('disconnected');
    setJournals([]);
    setSelectedJournal(null);

    addLog('info', `Iniciando prueba de conexión con OJS 3.4 en: ${ojsUrl}...`);

    if (!ojsUrl.trim() || !ojsApiKey.trim()) {
      addLog('error', 'Error de Conexión: URL de OJS o API Key faltantes.');
      setIsTestingConnection(false);
      return;
    }

    try {
      addLog('request', 'GET /api/v1/contexts (a través del proxy)');
      const fetchedJournals = await ojsApi.fetchJournals(ojsUrl, ojsApiKey);

      if (fetchedJournals.length === 0) {
        addLog('error', 'Conectado a OJS, pero no se encontraron revistas en este portal.');
        setOjsStatus('connected');
        setIsTestingConnection(false);
        return;
      }

      setJournals(fetchedJournals);
      setOjsStatus('connected');
      addLog('success', `Conexión establecida. Se encontraron ${fetchedJournals.length} revistas.`);

      // Auto-select best match
      const enabledJournals = fetchedJournals.filter((j) => j.enabled);
      const matched = fetchedJournals.find((j) => ojsUrl.includes(j.urlPath));
      const defaultJournal = matched ?? enabledJournals[0] ?? fetchedJournals[0] ?? null;

      if (defaultJournal) {
        setSelectedJournal(defaultJournal);
        addLog('info', `Revista preseleccionada: "${defaultJournal.name}" (ID: ${defaultJournal.id})`);
      }
    } catch (err: any) {
      addLog('error', `Error de red al conectar con OJS REST API\nDetalle: ${err.message ?? err}`);
      setOjsStatus('disconnected');
    } finally {
      setIsTestingConnection(false);
    }
  }, [ojsUrl, ojsApiKey, isTestingConnection, addLog]);

  /** Resolve or auto-fetch the current journal. Returns null on failure. */
  const resolveJournal = useCallback(async (customUrl?: string, customKey?: string, targetPath?: string): Promise<OjsJournal | null> => {
    const url = customUrl || ojsUrl;
    const key = customKey || ojsApiKey;

    if (selectedJournal && !customUrl) return selectedJournal;

    addLog('info', 'Intentando resolver revista en OJS...');
    try {
      const fetched = await ojsApi.fetchJournals(url, key);
      if (fetched.length > 0) {
        const matched = targetPath ? fetched.find(j => j.urlPath === targetPath) : null;
        const result = matched ?? fetched.find(j => j.enabled) ?? fetched[0];
        
        if (!customUrl) {
          setJournals(fetched);
          setSelectedJournal(result);
        }
        addLog('success', `Revista resuelta: ${result.name}`);
        return result;
      }
      addLog('error', 'No se encontraron revistas en el servidor OJS.');
      return null;
    } catch {
      addLog('error', 'No se pudo conectar con OJS para resolver la revista.');
      return null;
    }
  }, [selectedJournal, ojsUrl, ojsApiKey, addLog]);

  return {
    ojsUrl, setOjsUrl,
    ojsApiKey, setOjsApiKey,
    ojsStatus,
    journals,
    selectedJournal, setSelectedJournal,
    isTestingConnection,
    testOjsConnection,
    resolveJournal,
  };
}
