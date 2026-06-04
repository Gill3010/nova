import React from 'react';

interface RoleSwitcherProps {
  activeRole: 'admin_org' | 'ponente' | 'asistente' | 'revisor_eval';
  setActiveRole: (role: 'admin_org' | 'ponente' | 'asistente' | 'revisor_eval') => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ activeRole, setActiveRole }) => {
  const getButtonClass = (role: typeof activeRole) => {
    const base = 'text-xs font-semibold px-4 py-2.5 rounded-lg border transition-all duration-200 cursor-pointer select-none';
    if (activeRole === role) {
      return `${base} bg-gradient-to-r from-blue-600 to-indigo-650 text-white border-transparent shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/15 scale-105`;
    }
    return `${base} bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-350 dark:border-slate-800`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm gap-4 select-none">
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        Simular Portal de Rol:
      </span>
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          className={getButtonClass('admin_org')}
          onClick={() => setActiveRole('admin_org')}
        >
          🏢 Administrador / Organizador
        </button>
        <button
          type="button"
          className={getButtonClass('ponente')}
          onClick={() => setActiveRole('ponente')}
        >
          🎓 Ponente (Autor)
        </button>
        <button
          type="button"
          className={getButtonClass('asistente')}
          onClick={() => setActiveRole('asistente')}
        >
          👥 Asistente (Público)
        </button>
        <button
          type="button"
          className={getButtonClass('revisor_eval')}
          onClick={() => setActiveRole('revisor_eval')}
        >
          🔍 Revisor / Evaluador
        </button>
      </div>
    </div>
  );
};
