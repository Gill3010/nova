import React from 'react';
import { useReviewer } from '../context/ReviewerContext';

export const ReviewerSubmissionSelector: React.FC = () => {
  const { submissions, selectedSubmission, setSelectedSubmission } = useReviewer();

  if (submissions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="select-submission" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        Seleccionar Artículo para Evaluar
      </label>
      <select
        id="select-submission"
        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-950 dark:text-white outline-none focus:border-blue-500"
        value={selectedSubmission?.id || ''}
        onChange={(e) => {
          const sub = submissions.find(s => s.id === Number(e.target.value));
          if (sub) setSelectedSubmission(sub || null);
        }}
      >
        {submissions.map(s => (
          <option key={s.id} value={s.id}>
            #{s.ojs_submission_id} - {s.titulo_articulo || 'Sin título'}
          </option>
        ))}
      </select>
    </div>
  );
};
