import React from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface HeaderProps {
  onOpenDashboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDashboard }) => {
  return (
    <header className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-650 rounded-full flex items-center justify-center text-white font-extrabold text-lg select-none">
          N
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Nova Congreso</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Sistema de Creación y Gestión de Congresos Universitarios
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {onOpenDashboard && (
          <Button variant="secondary" onClick={onOpenDashboard} className="text-xs py-1.5 px-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 border-indigo-200 dark:border-indigo-800">
            📊 Ver BD Local
          </Button>
        )}
        <Badge variant="primary" className="font-semibold text-[10px] py-1 px-3">
          Integración OJS 3.4 Activa
        </Badge>
      </div>
    </header>
  );
};
