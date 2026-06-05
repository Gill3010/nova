import React, { useEffect, useRef } from 'react';
import { Trash2, Copy } from 'lucide-react';
import { useOjs } from '../../context/OjsContext';
import { useCongress } from '../../context/CongressContext';
import { Card } from '../common/Card';

const LOG_COLORS: Record<string, string> = {
  info:     'text-sky-400',
  success:  'text-emerald-400',
  request:  'text-indigo-400',
  response: 'text-amber-400',
  error:    'text-rose-400',
};

export const ConsoleLogs: React.FC = React.memo(() => {
  const { logs, clearConsole, copyPayload } = useOjs();
  const { getCongressJson } = useCongress();
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const congressJson = getCongressJson();

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Console */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 font-mono text-[11px] flex flex-col gap-3">
        {/* Terminal bar */}
        <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
          <div className="flex items-center gap-2">
            {/* Traffic lights — retained but simplified */}
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            </div>
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest ml-1">
              REST API Console
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded"
            onClick={clearConsole}
            aria-label="Limpiar consola"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            Limpiar
          </button>
        </div>

        {/* Log output */}
        <div
          className="h-60 overflow-y-auto flex flex-col gap-2 scroll-smooth pr-1 select-text"
          role="log"
          aria-live="polite"
          aria-label="Consola de actividad REST API"
        >
          {logs.length === 0 ? (
            <span className="text-zinc-600 italic">
              Consola limpia. Realiza una acción de sincronización.
            </span>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`leading-relaxed break-all ${LOG_COLORS[log.type] ?? 'text-zinc-400'}`}>
                <span className="text-zinc-600 mr-2">[{log.timestamp}]</span>
                <span>{log.message}</span>
                {log.payload && (
                  <pre className="bg-zinc-900/60 border border-zinc-900 rounded p-2.5 text-[10px] text-emerald-500 mt-1.5 max-h-36 overflow-y-auto font-mono select-all">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
          <div ref={consoleEndRef} />
        </div>
      </div>

      {/* Payload Inspector */}
      <Card className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
          <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
            Payload JSON
          </h3>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded transition-colors"
            onClick={() => copyPayload(congressJson)}
            aria-label="Copiar JSON al portapapeles"
          >
            <Copy className="h-3 w-3" aria-hidden="true" />
            Copiar
          </button>
        </div>
        <pre className="font-mono text-[10px] bg-zinc-950 border border-zinc-900 text-emerald-400 p-3.5 rounded overflow-x-auto max-h-52 select-all">
          {JSON.stringify(congressJson, null, 2)}
        </pre>
      </Card>
    </div>
  );
});

ConsoleLogs.displayName = 'ConsoleLogs';
