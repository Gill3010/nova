import React, { useEffect, useState } from 'react';
import { Users, Shield, ShieldAlert, CheckCircle2, XCircle, UserX, UserCheck, RefreshCw } from 'lucide-react';
import { fetchUsers, updateUserRole, toggleUserStatus } from '../../services/dbApi';
import type { PostgresUser } from '../../services/dbApi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<PostgresUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200"><ShieldAlert className="w-3 h-3 mr-1" /> Admin</Badge>;
      case 'organizer':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200"><Shield className="w-3 h-3 mr-1" /> Organizer</Badge>;
      case 'attendee':
        return <Badge variant="success" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200"><Users className="w-3 h-3 mr-1" /> Asistente</Badge>;
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
            Administra roles y accesos lógicos de los usuarios de la plataforma.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadUsers} disabled={isLoading}>
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
                <th scope="col" className="px-6 py-4 font-semibold text-right">Acciones</th>
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
                  <td className="px-6 py-4 text-right">
                    {user.id === currentUser.id ? (
                      <span className="text-xs text-slate-400 italic">Tú</span>
                    ) : (
                      <Button
                        variant={user.is_active ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={processingId === user.id}
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        className={user.is_active ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20' : ''}
                      >
                        {user.is_active ? (
                          <><UserX className="w-3.5 h-3.5 mr-1" /> Desactivar</>
                        ) : (
                          <><UserCheck className="w-3.5 h-3.5 mr-1" /> Activar</>
                        )}
                      </Button>
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
    </Card>
  );
};
