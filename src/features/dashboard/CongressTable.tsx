import React, { useState } from 'react';
import type { PostgresCongress } from '../../services/dbApi';

interface CongressTableProps {
  congresos: PostgresCongress[];
  onEdit?: (congress: PostgresCongress) => void;
}

export const CongressTable: React.FC<CongressTableProps> = ({ congresos, onEdit }) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

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
    <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
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
                  {congreso.nombre}
                </td>
                <td className="px-6 py-4">
                  {new Date(congreso.fecha_celebracion).toLocaleDateString()}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(congreso);
                      }}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✏️ Editar
                    </button>
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
                            <p className="mt-1">{congreso.descripcion}</p>
                          </div>
                          <div>
                            <span className="font-semibold block text-slate-500">Sede:</span>
                            {congreso.sede}
                          </div>
                          <div>
                            <span className="font-semibold block text-slate-500">Nivel Académico:</span>
                            {congreso.nivel_academico}
                          </div>
                          <div>
                            <span className="font-semibold block text-slate-500">Línea de Investigación:</span>
                            {congreso.linea_investigacion}
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
};
