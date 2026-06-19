import { useState, useCallback } from 'react';
import type { LogEntry } from '../types';

/**
 * Manages the REST API / Webhook activity log.
 * Extracted from useOjsIntegration for single responsibility.
 */
export function useOjsLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'Sistema iniciado. Listo para configurar integración con OJS 3.4.',
    },
  ]);

  const addLog = useCallback((type: LogEntry['type'], message: string, payload?: any) => {
    setLogs((prev) => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString(), type, message, payload },
    ]);
  }, []);

  const clearConsole = useCallback(() => setLogs([]), []);

  return { logs, addLog, clearConsole };
}
