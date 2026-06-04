import React from 'react';
import { Badge } from '../common/Badge';

export const Header: React.FC = () => {
  return (
    <header className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
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
      <Badge variant="primary" className="font-semibold text-[10px] py-1 px-3">
        Integración OJS 3.4 Activa
      </Badge>
    </header>
  );
};
