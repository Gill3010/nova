import React, { useEffect, useState } from 'react';
import { FileStack, Pencil, MoreVertical } from 'lucide-react';
import { fetchMySubmissions } from '../../services/dbApi';
import type { PostgresMySubmission } from '../../services/dbApi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

interface MySubmissionsProps {
  onEditSubmission?: (submission: PostgresMySubmission) => void;
}

export const MySubmissions: React.FC<MySubmissionsProps> = ({ onEditSubmission }) => {
  const [submissions, setSubmissions] = useState<PostgresMySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenMenuId(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
        <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-4">
          <FileStack className="h-6 w-6 text-zinc-400" aria-hidden="true" />
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
        <Badge variant="default" className="text-sm px-3 py-1">
          {submissions.length} {submissions.length === 1 ? 'Envío' : 'Envíos'}
        </Badge>
      </div>

      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm font-medium border-b border-slate-100 dark:border-slate-800">
              <th className="py-4 px-6 font-semibold">Título del Artículo</th>
              <th className="py-4 px-6 font-semibold">Congreso Destino</th>
              <th className="py-4 px-6 font-semibold">Categoría</th>
              <th className="py-4 px-6 font-semibold">Nivel Académico</th>
              <th className="py-4 px-6 font-semibold">Línea de Investigación</th>
              <th className="py-4 px-6 font-semibold">Estado (OJS ID)</th>
              <th className="py-4 px-6 font-semibold text-right">Fecha</th>
              <th className="py-4 px-6 font-semibold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
            {submissions.map((envio) => (
              <tr key={envio.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
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
                  <Badge variant="default" className="capitalize">
                    {envio.categoria || 'Ponencia'}
                  </Badge>
                </td>
                <td className="py-4 px-6 capitalize text-slate-700 dark:text-slate-300">
                  {envio.nivel_academico === 'maestria' ? 'Maestría' : envio.nivel_academico === 'doctorado' ? 'Doctorado' : envio.nivel_academico || 'N/A'}
                </td>
                <td className="py-4 px-6 text-slate-700 dark:text-slate-300">
                  {envio.linea_investigacion || 'N/A'}
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col gap-1 items-start">
                    <Badge variant="success">
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
                <td className="py-4 px-6 text-center">
                  {onEditSubmission && (
                    <div className="relative inline-block text-left">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === envio.id ? null : envio.id);
                        }}
                        className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Acciones"
                      >
                        <MoreVertical className="h-4.5 w-4.5" />
                      </button>

                      {openMenuId === envio.id && (
                        <div 
                          className="absolute right-0 mt-1.5 w-32 rounded-xl shadow-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1 z-50 flex flex-col gap-1 p-1 animate-in fade-in slide-in-from-top-1 duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              onEditSubmission(envio);
                            }}
                            className="w-full flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-2 rounded-lg transition-colors text-left"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Editar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
