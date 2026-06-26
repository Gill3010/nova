import React, { useEffect, useState } from 'react';
import { Users, Shield, ShieldAlert, CheckCircle2, XCircle, UserX, UserCheck, RefreshCw, ClipboardCheck, X, MoreVertical } from 'lucide-react';
import { fetchUsers, updateUserRole, toggleUserStatus, fetchDashboardData, assignRevisorEnvio, unassignRevisorEnvio, fetchRevisorAssignments } from '../../services/dbApi';
import type { PostgresUser, PostgresCongress } from '../../services/dbApi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<PostgresUser[]>([]);
  const [congresses, setCongresses] = useState<PostgresCongress[]>([]);
  const [assignments, setAssignments] = useState<{ revisor_id: number; envio_id: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRevisor, setSelectedRevisor] = useState<PostgresUser | null>(null);

  // Outside click listener to close dropdown menu
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

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, congressesData, assignmentsData] = await Promise.all([
        fetchUsers(),
        fetchDashboardData(),
        fetchRevisorAssignments()
      ]);
      setUsers(usersData);
      setCongresses(congressesData);
      setAssignments(assignmentsData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      setProcessingId(userId);
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, rol: newRole as any } : u));
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el rol');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      setProcessingId(userId);
      const newStatus = !currentStatus;
      await toggleUserStatus(userId, newStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: newStatus } : u));
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el estado del usuario');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleAssignment = async (revisorId: number, envioId: number, isCurrentlyAssigned: boolean) => {
    try {
      if (isCurrentlyAssigned) {
        await unassignRevisorEnvio(revisorId, envioId);
        setAssignments(prev => prev.filter(a => !(a.revisor_id === revisorId && a.envio_id === envioId)));
      } else {
        await assignRevisorEnvio(revisorId, envioId);
        setAssignments(prev => [...prev, { revisor_id: revisorId, envio_id: envioId }]);
      }
    } catch (err: any) {
      alert(err.message || 'Error al modificar la asignación');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200"><ShieldAlert className="w-3 h-3 mr-1" /> Admin</Badge>;
      case 'organizer':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200"><Shield className="w-3 h-3 mr-1" /> Organizer</Badge>;
      case 'attendee':
        return <Badge variant="success" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200"><Users className="w-3 h-3 mr-1" /> Asistente</Badge>;
      case 'reviewer':
        return <Badge variant="default" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200"><ClipboardCheck className="w-3 h-3 mr-1" /> Revisor</Badge>;
      case 'editor':
        return <Badge variant="default" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200"><Shield className="w-3 h-3 mr-1" /> Editor</Badge>;
      case 'speaker':
      default:
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">Speaker</Badge>;
    }
  };

  if (currentUser?.rol !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acceso Denegado</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">No tienes permisos para ver esta página.</p>
      </div>
    );
  }

  return (
    <Card className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Users className="h-5 w-5 text-zinc-500" aria-hidden="true" /> Gestión de Usuarios
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Administra roles, accesos lógicos y asigna revisiones científicas a los revisores.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadData} disabled={isLoading}>
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          {isLoading ? 'Cargando...' : 'Actualizar'}
        </Button>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200">
          <p>{error}</p>
        </div>
      ) : isLoading && users.length === 0 ? (
        <div className="h-60 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Usuario</th>
                <th scope="col" className="px-6 py-4 font-semibold">Rol Actual</th>
                <th scope="col" className="px-6 py-4 font-semibold">Estado</th>
                <th scope="col" className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-white">{user.nombre}</span>
                      <span className="text-xs text-slate-500">{user.email}</span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        Registrado: {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-2">
                      {getRoleBadge(user.rol)}
                      {user.id !== currentUser.id && user.is_active && (
                        <select
                          className="text-xs mt-1 border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-1 outline-none focus:border-blue-500"
                          value={user.rol}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={processingId === user.id}
                        >
                          <option value="attendee">Asistente</option>
                          <option value="speaker">Speaker</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                          <option value="reviewer">Revisor</option>
                          <option value="editor">Editor</option>
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-medium">
                        <XCircle className="w-4 h-4" /> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.id === currentUser.id ? (
                      <span className="text-xs text-slate-400 italic">Tú</span>
                    ) : (
                      <div className="relative inline-block text-left">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === user.id ? null : user.id);
                          }}
                          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          aria-label="Acciones"
                        >
                          <MoreVertical className="h-4.5 w-4.5" />
                        </button>

                        {openMenuId === user.id && (
                          <div 
                            className="absolute right-0 mt-1.5 w-40 rounded-xl shadow-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1 z-50 flex flex-col gap-1 p-1 animate-in fade-in slide-in-from-top-1 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {user.rol === 'reviewer' && user.is_active && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  setSelectedRevisor(user);
                                  setShowAssignModal(true);
                                }}
                                className="w-full flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-2 rounded-lg transition-colors text-left"
                              >
                                <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                Asignar Envíos
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                handleToggleStatus(user.id, user.is_active);
                              }}
                              disabled={processingId === user.id}
                              className={`w-full flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-colors text-left ${
                                user.is_active
                                  ? 'text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20'
                                  : 'text-emerald-650 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                              }`}
                            >
                              {user.is_active ? (
                                <>
                                  <UserX className="h-3.5 w-3.5" aria-hidden="true" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                  Activar
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-over/Modal de Asignaciones */}
      {showAssignModal && selectedRevisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col gap-0.5">
                <h3 id="modal-title" className="text-base font-bold text-zinc-900 dark:text-white">
                  Asignar Envíos a Revisor
                </h3>
                <p className="text-xs text-zinc-500">
                  Revisor: <span className="font-semibold text-zinc-700 dark:text-zinc-350">{selectedRevisor.nombre}</span> ({selectedRevisor.email})
                </p>
              </div>
              <button
                onClick={() => { setShowAssignModal(false); setSelectedRevisor(null); }}
                className="text-zinc-400 hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-400"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex flex-col gap-4">
              {congresses.length === 0 ? (
                <p className="text-sm text-zinc-500 italic text-center py-4">No hay congresos ni envíos registrados.</p>
              ) : (
                congresses.map(congress => {
                  const envios = congress.envios || [];
                  if (envios.length === 0) return null;
                  
                  return (
                    <div key={congress.id} className="flex flex-col gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {congress.nombre}
                      </h4>
                      <div className="flex flex-col gap-1.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                        {envios.map((envio: any) => {
                          const isAssigned = assignments.some(a => a.revisor_id === selectedRevisor.id && a.envio_id === envio.id);
                          return (
                            <label
                              key={envio.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                isAssigned
                                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500'
                                  : 'bg-zinc-50/50 dark:bg-zinc-900/35 border-zinc-200/65 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => handleToggleAssignment(selectedRevisor.id, envio.id, isAssigned)}
                                className="mt-0.5 rounded border-zinc-350 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 shrink-0"
                              />
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-zinc-900 dark:text-white">
                                  #{envio.ojs_submission_id} - {envio.titulo_articulo || 'Sin título'}
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                  Categoría: {envio.categoria} | Línea: {envio.linea_investigacion || 'General'}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end rounded-b-xl">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setShowAssignModal(false); setSelectedRevisor(null); }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
