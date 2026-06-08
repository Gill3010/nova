import React from 'react';
import { LogOut, Briefcase, CalendarDays } from 'lucide-react';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenDashboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDashboard }) => {
  const { user, logout } = useAuth();

  return (
    <header className="flex justify-between items-center px-5 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xs flex-wrap gap-4">
      <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo_nexus.jpg" alt="Nova Logo" className="h-8 object-contain rounded" />
            <span className="hidden sm:inline-block h-4 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden="true" />
          <span className="hidden sm:inline-block text-xs text-zinc-500 dark:text-zinc-400">
            Gestión de Congresos
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <>
            <span className="text-sm text-zinc-600 dark:text-zinc-400 mr-1">
              {user.nombre}
            </span>

            {onOpenDashboard && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenDashboard}
                aria-label={(user.rol === 'admin' || user.rol === 'organizer') ? "Volver a Mis Congresos" : "Ir al Directorio"}
              >
                {(user.rol === 'admin' || user.rol === 'organizer') ? (
                  <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  {(user.rol === 'admin' || user.rol === 'organizer') ? 'Mis Congresos' : 'Directorio'}
                </span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
