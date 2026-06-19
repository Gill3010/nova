import { useCallback } from 'react';
import { useOjsLogs } from './useOjsLogs';
import type { Congress } from '../types';

/**
 * Manages OJS integration logging and payload copying actions.
 */
export function useOjsLogger() {
  const { logs, addLog, clearConsole } = useOjsLogs();

  const copyPayload = useCallback((congressJson: Congress) => {
    navigator.clipboard.writeText(JSON.stringify(congressJson, null, 2));
    alert('¡Payload JSON copiado al portapapeles!');
  }, []);

  return {
    logs,
    addLog,
    clearConsole,
    copyPayload,
  };
}
