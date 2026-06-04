import React, { useEffect, useRef } from 'react';
import { useOjs } from '../../context/OjsContext';
import { useCongress } from '../../context/CongressContext';
import { Card } from '../common/Card';

export const ConsoleLogs: React.FC = () => {
  const { logs, clearConsole, copyPayload } = useOjs();
  const { getCongressJson } = useCongress();

  const consoleEndRef = useRef<HTMLDivElement>(null);
  const congressJson = getCongressJson();

  // Auto-scroll on new logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Consola de Simulación REST API / Webhooks */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 shadow-xl font-mono text-[11px] flex flex-col gap-4 select-none">
        <div className="flex justify-between items-center border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500"></span>
              <span className="h-3 w-3 rounded-full bg-amber-500"></span>
              <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">
              Console REST API & Webhooks
            </span>
          </div>
          <button
            type="button"
            className="text-[10px] text-slate-400 hover:text-white transition-colors bg-slate-900 hover:bg-slate-850 px-2.5 py-1 rounded-md font-sans font-medium"
            onClick={clearConsole}
          >
            Limpiar Consola
          </button>
        </div>

        <div className="h-64 overflow-y-auto flex flex-col gap-2.5 scroll-smooth pr-1 select-text">
          {logs.length === 0 ? (
            <div className="text-sky-450 italic">Consola limpia. Realiza una acción de sincronización.</div>
          ) : (
            logs.map((log, index) => {
              const textColors = {
                info: 'text-sky-400',
                success: 'text-emerald-400',
                request: 'text-indigo-400',
                response: 'text-amber-400',
                error: 'text-rose-400'
              };

              return (
                <div key={index} className={`leading-relaxed break-all ${textColors[log.type]}`}>
                  <span className="text-slate-600 mr-2">[{log.timestamp}]</span>
                  <span>{log.message}</span>
                  {log.payload && (
                    <pre className="bg-slate-900/60 border border-slate-900 rounded-lg p-3 text-[10px] text-emerald-500 mt-2 max-h-40 overflow-y-auto font-mono scrollbar-thin select-all">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })
          )}
          <div ref={consoleEndRef} />
        </div>
      </div>

      {/* Inspector de Payload del Congreso (Metadatos) */}
      <Card className="p-5 flex flex-col gap-3.5">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
            Payload JSON de Metadatos
          </h3>
          <button
            type="button"
            className="text-[10px] font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-250 dark:border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            onClick={() => copyPayload(congressJson)}
          >
            Copiar JSON
          </button>
        </div>
        <pre className="font-mono text-[10px] bg-slate-950 border border-slate-900 text-emerald-450 p-4 rounded-xl overflow-x-auto max-h-56 scrollbar-thin select-all">
          {JSON.stringify(congressJson, null, 2)}
        </pre>
      </Card>
    </div>
  );
};
