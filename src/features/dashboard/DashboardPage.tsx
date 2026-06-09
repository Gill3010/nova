import React, { useEffect, useState } from 'react';
import { RefreshCw, X, Briefcase, CalendarDays } from 'lucide-react';
import { fetchDashboardData } from '../../services/dbApi';
import type { PostgresCongress } from '../../services/dbApi';
import { StatCards } from './StatCards';
import { CongressTable } from './CongressTable';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

interface DashboardPageProps {
  onClose: () => void;
  onEditCongress?: (congress: PostgresCongress, action?: 'view' | 'edit') => void;
  forceDirectorio?: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onClose, onEditCongress, forceDirectorio }) => {
  const { user } = useAuth();
  const isAdminOrOrg = user?.rol === 'admin' || user?.rol === 'organizer';
  const isDirectorio = forceDirectorio || !isAdminOrOrg;

  const [viewScope, setViewScope] = useState<'mine' | 'all'>(isDirectorio ? 'all' : 'mine');
  const [data, setData] = useState<PostgresCongress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (scopeToLoad = viewScope) => {
    setIsLoading(true);
    setError(null);
    try {
      const scope = forceDirectorio ? 'all' : scopeToLoad;
      const result = await fetchDashboardData(scope);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor local');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(viewScope);
  }, [viewScope]);

  const totalCongresos = data.length;
  const totalEnvios = data.reduce((acc, congreso) => acc + congreso.envios.length, 0);
  const isMine = viewScope === 'mine' && !forceDirectorio;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            {isMine ? (
              <Briefcase className="h-5 w-5 text-zinc-500" aria-hidden="true" />
            ) : (
              <CalendarDays className="h-5 w-5 text-zinc-500" aria-hidden="true" />
            )}
            {isMine ? 'Mis Congresos' : 'Directorio de Eventos'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {isMine
              ? 'Gestiona y visualiza los congresos que tienes a tu cargo.'
              : 'Explora todos los eventos registrados en la plataforma y accede a su itinerario público.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => loadData(viewScope)} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            {isLoading ? 'Actualizando...' : 'Refrescar'}
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Cerrar
          </Button>
        </div>
      </div>

      {isAdminOrOrg && !forceDirectorio ? (
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl self-start gap-1 border border-zinc-200 dark:border-zinc-700/50 shadow-xs">
          <button
            onClick={() => setViewScope('mine')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${viewScope === 'mine'
                ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
          >
            Mis Congresos
          </button>
          <button
            onClick={() => setViewScope('all')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${viewScope === 'all'
                ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
          >
            Directorio de Eventos
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800 flex flex-col gap-2">
          <strong>Error de Conexión</strong>
          <p>{error}</p>
          <p className="text-xs opacity-80 mt-1">Asegúrate de que el backend de Node.js esté corriendo en el puerto 3001.</p>
        </div>
      ) : (
        <>
          {isAdminOrOrg && isMine ? (
            <StatCards totalCongresos={totalCongresos} totalEnvios={totalEnvios} />
          ) : null}

          <div className="flex flex-col gap-3 mt-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isMine ? 'Listado de Congresos' : 'Eventos Disponibles'}
            </h2>
            {isLoading ? (
              <div className="h-60 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <div className="text-sm text-zinc-400">Cargando...</div>
              </div>
            ) : (
              <CongressTable
                congresos={data}
                onEdit={onEditCongress}
                userRole={user?.rol}
                currentUserId={user?.id}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};
