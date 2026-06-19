import React from 'react';
import { ClipboardCheck, RefreshCw } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ReviewerProvider, useReviewer } from './context/ReviewerContext';
import { ReviewerSubmissionSelector } from './components/ReviewerSubmissionSelector';
import { ReviewerFilePreviewer } from './components/ReviewerFilePreviewer';
import { ReviewerEvaluationForm } from './components/ReviewerEvaluationForm';

const ReviewerPageContent: React.FC = () => {
  const { submissions, selectedSubmission, isLoading, loadSubmissions } = useReviewer();

  return (
    <Card className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <ClipboardCheck className="h-5 w-5 text-zinc-500" aria-hidden="true" /> Panel de Revisión Científica
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Evalúa los artículos y visualiza el material adjunto en tiempo real.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadSubmissions} disabled={isLoading}>
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          {isLoading ? 'Cargando...' : 'Actualizar'}
        </Button>
      </div>

      {isLoading ? (
        <div className="h-60 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <ClipboardCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-medium">No tienes artículos asignados en este momento.</p>
          <p className="text-xs text-slate-400 mt-1">Las asignaciones las realizan los directores u organizadores del congreso desde el panel de usuarios.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <ReviewerSubmissionSelector />

          {selectedSubmission && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
              <ReviewerFilePreviewer />
              <ReviewerEvaluationForm />
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export const ReviewerPage: React.FC = () => {
  return (
    <ReviewerProvider>
      <ReviewerPageContent />
    </ReviewerProvider>
  );
};
