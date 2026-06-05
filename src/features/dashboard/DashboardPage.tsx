import React, { useEffect, useState } from 'react';
import { RefreshCw, X, Database } from 'lucide-react';
import { fetchDashboardData } from '../../services/dbApi';
import type { PostgresCongress } from '../../services/dbApi';
import { StatCards } from './StatCards';
import { CongressTable } from './CongressTable';
import { Button } from '../../components/common/Button';

interface DashboardPageProps {
  onClose: () => void;
  onEditCongress?: (congress: PostgresCongress) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onClose, onEditCongress }) => {
  const [data, setData] = useState<PostgresCongress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData('mine');
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor local');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCongresos = data.length;
  const totalEnvios = data.reduce((acc, congreso) => acc + congreso.envios.length, 0);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Database className="h-5 w-5 text-zinc-500" aria-hidden="true" /> Base de Datos Local
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Visualización en tiempo real de los congresos y envíos registrados.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            {isLoading ? 'Actualizando...' : 'Refrescar'}
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Cerrar
          </Button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800 flex flex-col gap-2">
          <strong>Error de Conexión</strong>
          <p>{error}</p>
          <p className="text-xs opacity-80 mt-1">Asegúrate de que el backend de Node.js esté corriendo en el puerto 3001.</p>
        </div>
      ) : (
        <>
          <StatCards totalCongresos={totalCongresos} totalEnvios={totalEnvios} />
          
          <div className="flex flex-col gap-3 mt-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Registro de Congresos
            </h2>
            {isLoading ? (
              <div className="h-60 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <div className="text-sm text-zinc-400">Cargando...</div>
              </div>
            ) : (
              <CongressTable congresos={data} onEdit={onEditCongress} />
            )}
          </div>
        </>
      )}
    </div>
  );
};
