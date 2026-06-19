import React from 'react';
import { Bot, Star, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { SystemReport } from '../../../services/dbApi';

interface ReviewerSystemReportProps {
  report: SystemReport | null;
  isLoading: boolean;
}

interface ScoreBarProps {
  label: string;
  value: number | null;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, value }) => {
  if (value === null) return null;
  const pct = (value / 10) * 100;
  const color = value >= 8 ? 'bg-emerald-500' : value >= 6 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{value}/10</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const avgScore = (r: SystemReport) => {
  const vals = [r.score_scientific, r.score_originality, r.score_presentation].filter(
    (v): v is number => v !== null
  );
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
};

export const ReviewerSystemReport: React.FC<ReviewerSystemReportProps> = ({ report, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-slate-400 text-sm">
        <Clock className="h-4 w-4 animate-spin" />
        <span>Consultando revisión preliminar del sistema…</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <Clock className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Revisión preliminar pendiente
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            El sistema generará el análisis automático del manuscrito una vez que el ponente adjunte el archivo.
          </p>
        </div>
      </div>
    );
  }

  const avg = avgScore(report);
  const isApproved = avg !== null && avg >= 7;
  const generatedDate = new Date(report.created_at).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40">
            <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Revisión preliminar del sistema
            </p>
            <p className="text-[10px] text-slate-400">Generado el {generatedDate}</p>
          </div>
        </div>

        {avg !== null && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            isApproved
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
          }`}>
            {isApproved
              ? <CheckCircle2 className="h-3.5 w-3.5" />
              : <AlertCircle className="h-3.5 w-3.5" />
            }
            {avg.toFixed(1)}/10
          </div>
        )}
      </div>

      {/* Barras de puntuación */}
      <div className="flex flex-col gap-3 bg-slate-50/70 dark:bg-slate-900/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
        <ScoreBar label="Calidad científica" value={report.score_scientific} />
        <ScoreBar label="Originalidad" value={report.score_originality} />
        <ScoreBar label="Presentación" value={report.score_presentation} />

        {/* Puntuación promedio */}
        {avg !== null && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Promedio del sistema:</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{avg.toFixed(2)} / 10</span>
          </div>
        )}
      </div>

      {/* Comentarios del sistema */}
      {report.comments && (
        <div className="bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-400 mb-2">
            Observaciones del sistema
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {report.comments}
          </p>
        </div>
      )}
    </div>
  );
};
