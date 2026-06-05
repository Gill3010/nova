import React, { useState } from 'react';
import { ClipboardCheck, Check } from 'lucide-react';
import { useSpeaker } from '../../context/SpeakerContext';
import { useCongress } from '../../context/CongressContext';
import { useOjs } from '../../context/OjsContext';
import { Card } from '../../components/common/Card';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import type { Evaluation } from '../../types';

export const ReviewerPage: React.FC = () => {
  const { submissionTitle, submissionCategory, setSubmissionStatus } = useSpeaker();
  const { lines, selectedLine } = useCongress();
  const { addLog } = useOjs();

  // Local state for Reviewer (encapsulated)
  const [scoreScientific, setScoreScientific] = useState(8);
  const [scoreOriginality, setScoreOriginality] = useState(7);
  const [scorePresentation, setScorePresentation] = useState(9);
  const [evalComments, setEvalComments] = useState(
    'Excelente rigor científico y metodología clara. Se sugiere corregir el formato de las referencias bibliográficas en el manuscrito completo.'
  );
  const [evalStatus, setEvalStatus] = useState<'pending' | 'submitted'>('pending');

  const selectedLineName = lines.find((l) => l.id === selectedLine)?.name || 'General';
  const averageScore = (scoreScientific + scoreOriginality + scorePresentation) / 3;
  const isApproved = averageScore >= 7;

  const handleEvaluationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEvalStatus('submitted');
    setSubmissionStatus('reviewed');

    const evaluationData: Evaluation = {
      scoreScientific,
      scoreOriginality,
      scorePresentation,
      comments: evalComments,
      approved: isApproved
    };

    addLog('success', 'Evaluación científica enviada al Editor.', evaluationData);
  };

  const renderScoreSelector = (
    label: string,
    description: string,
    currentValue: number,
    setValue: (val: number) => void
  ) => {
    return (
      <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-805/60 pb-4">
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
                className={`h-9 w-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-100 dark:ring-blue-900/30 scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-350'
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
    <Card className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
          <ClipboardCheck className="h-5 w-5 text-zinc-500" aria-hidden="true" /> Evaluación Académica
        </h2>
      </div>

      <div className="flex flex-col gap-5">
        {/* Detalles del trabajo asignado */}
        <div className="border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Trabajo asignado para revisión por doble ciego
          </span>
          <strong className="text-base font-bold text-slate-900 dark:text-white leading-relaxed mt-1">
            "{submissionTitle}"
          </strong>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="default">Categoría: {submissionCategory.toUpperCase()}</Badge>
            <Badge variant="outline">Línea: {selectedLineName}</Badge>
          </div>
        </div>

        {evalStatus === 'pending' ? (
          <form onSubmit={handleEvaluationSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Rúbrica de Evaluación Científica (Escala 1 al 10)
              </label>

              {renderScoreSelector(
                'Calidad Científica',
                'Metodología, rigor y validez del estudio expuesto.',
                scoreScientific,
                setScoreScientific
              )}

              {renderScoreSelector(
                'Originalidad',
                'Novedad y aporte de la investigación al estado del arte.',
                scoreOriginality,
                setScoreOriginality
              )}

              {renderScoreSelector(
                'Presentación Oral / Video',
                'Claridad, capacidad de síntesis y calidad del material multimedia.',
                scorePresentation,
                setScorePresentation
              )}
            </div>

            <Textarea
              id="eval-comments"
              label="Comentarios y Observaciones (Ciego)"
              rows={4}
              value={evalComments}
              onChange={(e) => setEvalComments(e.target.value)}
              placeholder="Escriba comentarios constructivos para el autor..."
              required
            />

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2">
              Enviar Calificación
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-5 items-center text-center py-4">
            <span className="h-12 w-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center select-none">
              <Check className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Evaluación Enviada con Éxito</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tus calificaciones ciegos y comentarios se han enviado directamente a los directores y editores del
                congreso.
              </p>
            </div>

            {/* Hoja de calificaciones del Revisor */}
            <div className="w-full max-w-sm border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 p-5 flex flex-col gap-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-805/60 pb-3">
                <span className="text-slate-550 dark:text-slate-400 font-semibold">Puntaje Promedio:</span>
                <strong className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {averageScore.toFixed(1)} / 10
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-550 dark:text-slate-400 font-semibold">Veredicto Final:</span>
                <Badge variant={isApproved ? 'success' : 'destructive'}>
                  {isApproved ? 'Aprobado para publicación' : 'Rechazado'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
