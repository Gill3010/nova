import React from 'react';
import type { Contributor } from '../../../types';

interface ContributorsSectionProps {
  contributors: Contributor[];
  onUpdateContributor: (index: number, field: keyof Contributor, value: string) => void;
  onAddContributor: () => void;
  onRemoveContributor: (index: number) => void;
}

export const ContributorsSection: React.FC<ContributorsSectionProps> = React.memo(({
  contributors,
  onUpdateContributor,
  onAddContributor,
  onRemoveContributor
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Colaboradores / Autores <span className="text-[10px] text-blue-500 font-normal ml-1">Se registran como Authors en OJS</span>
        </label>
        <button
          type="button"
          onClick={onAddContributor}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition-colors"
        >
          + Añadir colaborador
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {contributors.map((c, i) => (
          <div
            key={i}
            className="relative border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Colaborador #{i + 1}</span>
              {contributors.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveContributor(i)}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors"
                >
                  × Eliminar
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor={`contrib-${i}-givenName`} className="text-xs font-medium text-slate-600 dark:text-slate-400">Nombre(s)</label>
                <input
                  id={`contrib-${i}-givenName`}
                  type="text"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={c.givenName}
                  onChange={(e) => onUpdateContributor(i, 'givenName', e.target.value)}
                  placeholder="Nombre(s)"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={`contrib-${i}-familyName`} className="text-xs font-medium text-slate-600 dark:text-slate-400">Apellido(s)</label>
                <input
                  id={`contrib-${i}-familyName`}
                  type="text"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={c.familyName}
                  onChange={(e) => onUpdateContributor(i, 'familyName', e.target.value)}
                  placeholder="Apellido(s)"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={`contrib-${i}-email`} className="text-xs font-medium text-slate-600 dark:text-slate-400">Correo electrónico <span className="text-rose-500">*</span></label>
                <input
                  id={`contrib-${i}-email`}
                  type="email"
                  required
                  aria-required="true"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={c.email}
                  onChange={(e) => onUpdateContributor(i, 'email', e.target.value)}
                  placeholder="correo@universidad.edu"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={`contrib-${i}-country`} className="text-xs font-medium text-slate-600 dark:text-slate-400">País (código ISO)</label>
                <input
                  id={`contrib-${i}-country`}
                  type="text"
                  maxLength={2}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition uppercase"
                  value={c.country}
                  onChange={(e) => onUpdateContributor(i, 'country', e.target.value.toUpperCase())}
                  placeholder="PA"
                />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label htmlFor={`contrib-${i}-affiliation`} className="text-xs font-medium text-slate-600 dark:text-slate-400">Institución / Universidad</label>
                <input
                  id={`contrib-${i}-affiliation`}
                  type="text"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={c.affiliation}
                  onChange={(e) => onUpdateContributor(i, 'affiliation', e.target.value)}
                  placeholder="Universidad de Panamá, Facultad de Ciencias..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

ContributorsSection.displayName = 'ContributorsSection';
