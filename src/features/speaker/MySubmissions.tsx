import React, { useEffect, useState } from 'react';
import { fetchMySubmissions } from '../../services/dbApi';
import type { PostgresMySubmission } from '../../services/dbApi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const MySubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<PostgresMySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const data = await fetchMySubmissions();
        setSubmissions(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadSubmissions();
  }, []);

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded w-full"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center text-rose-500">
        <p>No se pudo cargar el historial: {error}</p>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card className="p-12 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-3xl mb-4">
          📁
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Aún no tienes envíos
        </h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Tus ponencias y artículos enviados a los distintos congresos aparecerán aquí para que puedas darles seguimiento.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mis Envíos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Historial de artículos y ponencias radicadas en OJS
          </p>
        </div>
        <Badge variant="primary" className="text-sm px-3 py-1">
          {submissions.length} {submissions.length === 1 ? 'Envío' : 'Envíos'}
        </Badge>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm font-medium border-b border-slate-100 dark:border-slate-800">
              <th className="py-4 px-6 font-semibold">Título del Artículo</th>
              <th className="py-4 px-6 font-semibold">Congreso Destino</th>
              <th className="py-4 px-6 font-semibold">Categoría</th>
              <th className="py-4 px-6 font-semibold">Estado (OJS ID)</th>
              <th className="py-4 px-6 font-semibold text-right">Fecha</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
            {submissions.map((envio) => (
              <tr key={envio.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="py-4 px-6">
                  <div className="font-medium text-slate-900 dark:text-slate-200">
                    {envio.titulo_articulo || 'Sin Título'}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {envio.congreso_nombre}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <Badge variant="secondary" className="capitalize">
                    {envio.categoria || 'Ponencia'}
                  </Badge>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col gap-1 items-start">
                    <Badge variant="success" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Enviado
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">
                      ID: {envio.ojs_submission_id}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 text-right text-slate-500 whitespace-nowrap">
                  {new Date(envio.created_at).toLocaleDateString('es-ES', { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
