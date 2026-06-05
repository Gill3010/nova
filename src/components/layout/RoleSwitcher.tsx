import React from 'react';
import { Building2, GraduationCap, Users, ClipboardCheck } from 'lucide-react';

interface RoleSwitcherProps {
  activeRole: 'admin_org' | 'ponente' | 'asistente' | 'revisor_eval';
  setActiveRole: (role: 'admin_org' | 'ponente' | 'asistente' | 'revisor_eval') => void;
}

const ROLES: {
  id: 'admin_org' | 'ponente' | 'asistente' | 'revisor_eval';
  label: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'admin_org',    label: 'Administrador',  Icon: Building2       },
  { id: 'ponente',      label: 'Ponente',         Icon: GraduationCap   },
  { id: 'asistente',    label: 'Asistente',       Icon: Users           },
  { id: 'revisor_eval', label: 'Revisor',         Icon: ClipboardCheck  },
];

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ activeRole, setActiveRole }) => {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg gap-3"
      role="group"
      aria-label="Simular portal de rol"
    >
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
        Vista de rol:
      </span>
      <div className="flex flex-wrap gap-1.5">
        {ROLES.map(({ id, label, Icon }) => {
          const isActive = activeRole === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveRole(id)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors duration-150 select-none ${
                isActive
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
