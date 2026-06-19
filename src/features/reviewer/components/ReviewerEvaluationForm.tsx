import React from 'react';
import { Check } from 'lucide-react';
import { useReviewer } from '../context/ReviewerContext';
import { Badge } from '../../../components/common/Badge';
import { Textarea } from '../../../components/common/Textarea';
import { Button } from '../../../components/common/Button';

export const ReviewerEvaluationForm: React.FC = () => {
  const {
    selectedSubmission,
    scoreScientific,
    setScoreScientific,
    scoreOriginality,
    setScoreOriginality,
    scorePresentation,
    setScorePresentation,
    evalComments,
    setEvalComments,
    evalStatus,
    setEvalStatus,
    isSubmitting,
    handleEvaluationSubmit,
    averageScore,
    isApproved
  } = useReviewer();

  if (!selectedSubmission) return null;

  const renderScoreSelector = (
    label: string,
    description: string,
    currentValue: number,
    setValue: (val: number) => void
  ) => {
    const isSubmitted = evalStatus === 'submitted';
    return (
      <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex flex-col">
          <strong className="text-sm font-semibold text-slate-850 dark:text-slate-200">{label}</strong>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
            const isSelected = currentValue === val;
            return (
              <button
                key={val}
                type="button"
                disabled={isSubmitted}
                className={`h-8 w-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-100 dark:ring-blue-900/30 scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-350 disabled:opacity-80'
                }`}
                onClick={() => setValue(val)}
              >
                {val}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="lg:col-span-5 w-full flex flex-col gap-5">
      {evalStatus === 'pending' ? (
        <form onSubmit={handleEvaluationSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1">
              Rúbrica de Calificación Científica
            </label>

            {renderScoreSelector(
              'Calidad Científica',
              'Metodología, rigor y validez del estudio expuesto.',
              scoreScientific,
              setScoreScientific
            )}

            {renderScoreSelector(
              'Originalidad',
              'Novedad y aporte al estado del arte.',
              scoreOriginality,
              setScoreOriginality
            )}

            {renderScoreSelector(
              'Presentación Oral / Video',
              'Claridad, síntesis y material de soporte.',
              scorePresentation,
              setScorePresentation
            )}
          </div>

          <Textarea
            id="eval-comments"
            label="Comentarios y Observaciones (Ciego)"
            rows={3}
            value={evalComments}
            onChange={(e) => setEvalComments(e.target.value)}
            placeholder="Escribe comentarios constructivos para el autor..."
            required
          />

          <Button type="submit" variant="primary" size="lg" className="w-full mt-1" isLoading={isSubmitting}>
            Enviar Calificación
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-4 items-center text-center py-2 animate-fade-in">
          <span className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center select-none">
            <Check className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Artículo Evaluado</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tus calificaciones y comentarios han sido registrados correctamente en la base de datos.
            </p>
          </div>

          {/* Hoja de calificaciones del Revisor */}
          <div className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 p-4 flex flex-col gap-3 text-xs text-left">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-slate-550 dark:text-slate-400 font-semibold">Calidad Científica:</span>
              <strong className="text-slate-900 dark:text-white">{scoreScientific} / 10</strong>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-slate-550 dark:text-slate-400 font-semibold">Originalidad:</span>
              <strong className="text-slate-900 dark:text-white">{scoreOriginality} / 10</strong>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-slate-550 dark:text-slate-400 font-semibold">Presentación Oral:</span>
              <strong className="text-slate-900 dark:text-white">{scorePresentation} / 10</strong>
            </div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 flex flex-col gap-1">
              <span className="text-slate-550 dark:text-slate-400 font-semibold">Comentarios:</span>
              <p className="text-slate-700 dark:text-slate-355 italic">{evalComments}</p>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-slate-550 dark:text-slate-400 font-semibold">Promedio:</span>
              <strong className="text-xs font-extrabold text-slate-900 dark:text-white">
                {averageScore.toFixed(1)} / 10
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-550 dark:text-slate-400 font-semibold">Veredicto Final:</span>
              <Badge variant={isApproved ? 'success' : 'destructive'}>
                {isApproved ? 'Aprobado' : 'Rechazado'}
              </Badge>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEvalStatus('pending')}
            className="mt-1"
          >
            Modificar Evaluación
          </Button>
        </div>
      )}
    </div>
  );
};
