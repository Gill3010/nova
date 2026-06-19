import React, { useState, useEffect } from 'react';
import { Pencil, Archive, Trash2, ArchiveRestore, MoreVertical } from 'lucide-react';
import type { PostgresCongress } from '../../services/dbApi';
import { updateCongressState, deleteCongress } from '../../services/dbApi';

interface CongressTableProps {
  congresos: PostgresCongress[];
  onEdit?: (congress: PostgresCongress, action?: 'view' | 'edit') => void;
  userRole?: string;
  currentUserId?: number;
  onRefresh?: () => void;
}

export const CongressTable: React.FC<CongressTableProps> = React.memo(({ congresos, onEdit, userRole, currentUserId, onRefresh }) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
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
  
  const canEditCongress = (congreso: PostgresCongress) => {
    if (userRole === 'admin') return true;
    if (userRole === 'organizer' && congreso.creador_id === currentUserId) return true;
    return false;
  };

  const handleToggleEstado = async (e: React.MouseEvent, id: number, currentEstado?: string) => {
    e.stopPropagation();
    const nuevoEstado = currentEstado === 'Archivado' ? 'Activo' : 'Archivado';
    const msg = nuevoEstado === 'Archivado' 
      ? '¿Estás seguro de que deseas archivar/desactivar este congreso? Los usuarios ya no podrán realizar nuevos envíos.'
      : '¿Estás seguro de que deseas reactivar este congreso?';
    
    if (!window.confirm(msg)) return;

    setIsProcessing(id);
    try {
      const token = localStorage.getItem('nova_token') || '';
      await updateCongressState(id, nuevoEstado, token);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar el estado del congreso');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente este congreso? Esta acción no se puede deshacer y también intentará borrar los envíos en OJS.')) {
      return;
    }

    setIsProcessing(id);
    try {
      const token = localStorage.getItem('nova_token') || '';
      await deleteCongress(id, token);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el congreso');
    } finally {
      setIsProcessing(null);
    }
  };

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (congresos.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <p className="text-slate-500 dark:text-slate-400">No hay congresos registrados en la base de datos local aún.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm min-h-[250px]">
      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-6 py-4">Nombre del Congreso</th>
            <th className="px-6 py-4">Fecha</th>
            <th className="px-6 py-4">Modalidad</th>
            <th className="px-6 py-4 text-center">Envíos</th>
            <th className="px-6 py-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {congresos.map((congreso) => (
            <React.Fragment key={congreso.id}>
              {/* Fila Principal del Congreso */}
              <tr 
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                onClick={() => toggleRow(congreso.id)}
              >
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{congreso.nombre}</span>
                      {congreso.estado === 'Archivado' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-150 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                          Archivado
                        </span>
                      )}
                    </div>
                    {congreso.lema && (
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        "{congreso.lema}"
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(congreso.fecha_celebracion).toLocaleDateString()}
                  {congreso.fecha_finalizacion && congreso.fecha_finalizacion !== congreso.fecha_celebracion && (
                    <>
                      <span className="mx-1 text-slate-400">al</span>
                      {new Date(congreso.fecha_finalizacion).toLocaleDateString()}
                    </>
                  )}
                </td>
                <td className="px-6 py-4 capitalize">
                  {congreso.modalidad}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {congreso.envios.length}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {onEdit && (
                    <div className="relative inline-block text-left">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === congreso.id ? null : congreso.id);
                        }}
                        className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Acciones"
                      >
                        <MoreVertical className="h-4.5 w-4.5" />
                      </button>

                      {openMenuId === congreso.id && (
                        <div 
                          className="absolute right-0 mt-1.5 w-40 rounded-xl shadow-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1.5 z-50 flex flex-col gap-1 p-1 animate-in fade-in slide-in-from-top-1 duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              onEdit(congreso, 'view');
                            }}
                            className="w-full flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-lg transition-colors text-left"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            Ver Evento
                          </button>
                          
                          {canEditCongress(congreso) && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  onEdit(congreso, 'edit');
                                }}
                                className="w-full flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-2 rounded-lg transition-colors text-left"
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                Editar
                              </button>
                              
                              <button
                                disabled={isProcessing === congreso.id}
                                onClick={(e) => {
                                  setOpenMenuId(null);
                                  handleToggleEstado(e, congreso.id, congreso.estado);
                                }}
                                className={`w-full flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-colors text-left ${
                                  congreso.estado === 'Archivado'
                                    ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                }`}
                              >
                                {congreso.estado === 'Archivado' ? (
                                  <>
                                    <ArchiveRestore className="h-3.5 w-3.5" />
                                    Reactivar
                                  </>
                                ) : (
                                  <>
                                    <Archive className="h-3.5 w-3.5" />
                                    Archivar
                                  </>
                                )}
                              </button>
                              
                              <button
                                disabled={isProcessing === congreso.id}
                                onClick={(e) => {
                                  setOpenMenuId(null);
                                  handleDelete(e, congreso.id);
                                }}
                                className="w-full flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors text-left"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
              
              {/* Acordeón de Detalles Completos */}
              {expandedRow === congreso.id && (
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <td colSpan={4} className="px-6 py-4">
                    <div className="flex flex-col gap-6 pl-4 border-l-2 border-indigo-300 dark:border-indigo-600">
                      
                      {/* Detalles del Congreso */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-2">
                          Información Completa del Congreso
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50">
                          <div className="col-span-full">
                            <span className="font-semibold block text-slate-500">Descripción / Convocatoria:</span>
                            {congreso.lema && (
                              <p className="mt-1 text-indigo-600 dark:text-indigo-400 italic mb-2">"{congreso.lema}"</p>
                            )}
                            <p className="mt-1">{congreso.descripcion}</p>
                          </div>
                          <div>
                            <span className="font-semibold block text-slate-500">Sede:</span>
                            {congreso.sede}
                          </div>
                          <div>
                            <span className="font-semibold block text-slate-500">Aula / Canal Asignado:</span>
                            {congreso.aula_canal}
                          </div>
                        </div>
                      </div>

                      {/* Detalles de los Envíos */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-2">
                          Artículos / Envíos Asociados ({congreso.envios.length})
                        </h4>
                        {congreso.envios.length > 0 ? (
                          <div className="overflow-x-auto bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                  <th className="p-3 font-semibold text-left">OJS ID</th>
                                  <th className="p-3 font-semibold text-left min-w-[200px]">Título del Artículo</th>
                                  <th className="p-3 font-semibold text-left min-w-[150px]">Revista Destino</th>
                                  <th className="p-3 font-semibold text-left">Categoría</th>
                                  <th className="p-3 font-semibold text-left">Nivel Académico</th>
                                  <th className="p-3 font-semibold text-left">Línea de Investigación</th>
                                  <th className="p-3 font-semibold text-left min-w-[150px]">Colaboradores</th>
                                  <th className="p-3 font-semibold text-left min-w-[150px]">Palabras Claves</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                                {congreso.envios.map(envio => {
                                  // Parsear colaboradores si vienen como JSON string
                                  let autores = envio.colaboradores || envio.autor_email;
                                  try {
                                    if (envio.colaboradores && envio.colaboradores.startsWith('[')) {
                                      const parsed = JSON.parse(envio.colaboradores);
                                      autores = parsed.map((c: any) => typeof c === 'string' ? c : `${c.givenName} ${c.familyName || ''}`.trim()).join(', ');
                                    }
                                  } catch (e) {}

                                  return (
                                    <tr key={envio.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                      <td className="p-3 text-indigo-600 dark:text-indigo-400 font-mono font-medium">#{envio.ojs_submission_id}</td>
                                      <td className="p-3 font-medium text-slate-900 dark:text-white">{envio.titulo_articulo || 'Sin título'}</td>
                                      <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">{envio.revista_destino || 'N/A'}</td>
                                      <td className="p-3 capitalize">{envio.categoria}</td>
                                      <td className="p-3 capitalize">{envio.nivel_academico === 'maestria' ? 'Maestría' : envio.nivel_academico === 'doctorado' ? 'Doctorado' : envio.nivel_academico || 'N/A'}</td>
                                      <td className="p-3 text-slate-600 dark:text-slate-450">{envio.linea_investigacion || 'N/A'}</td>
                                      <td className="p-3 text-slate-600 dark:text-slate-400">{autores}</td>
                                      <td className="p-3 text-slate-500 italic">{envio.palabras_claves || '-'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400 italic pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                            Aún no hay artículos recibidos para este congreso.
                          </div>
                        )}
                      </div>

                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
});

CongressTable.displayName = 'CongressTable';
