import React, { useEffect, useState } from 'react';
import { fetchDashboardData } from '../../services/dbApi';
import type { PostgresCongress } from '../../services/dbApi';
import { StatCards } from './StatCards';
import { CongressTable } from './CongressTable';
import { Button } from '../../components/common/Button';

interface DashboardPageProps {
  onClose: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onClose }) => {
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-indigo-500">📊</span> PostgreSQL Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visualización en tiempo real de la base de datos local de Nova.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadData} disabled={isLoading}>
            {isLoading ? 'Actualizando...' : '↻ Refrescar'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            ✕ Cerrar Dashboard
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
              <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="animate-pulse text-slate-400">Cargando base de datos...</div>
              </div>
            ) : (
              <CongressTable congresos={data} />
            )}
          </div>
        </>
      )}
    </div>
  );
};
