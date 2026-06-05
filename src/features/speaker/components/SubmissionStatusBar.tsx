import React from 'react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';

interface SubmissionStatusBarProps {
  submissionStatus: 'draft' | 'submitted' | 'reviewed';
  isEditMode: boolean;
  isPublishing: boolean;
  onPublishClick: () => void;
}

export const SubmissionStatusBar: React.FC<SubmissionStatusBarProps> = React.memo(({
  submissionStatus,
  isEditMode,
  isPublishing,
  onPublishClick
}) => {
  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-805 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2.5 text-sm">
        <span className="text-slate-600 dark:text-slate-400 font-medium">Estado de la Ponencia:</span>
        <Badge
          variant={
            submissionStatus === 'draft' ? 'default' : submissionStatus === 'submitted' ? 'warning' : 'success'
          }
        >
          {submissionStatus === 'draft' && 'Borrador'}
          {submissionStatus === 'submitted' && 'Sincronizado (En Revisión)'}
          {submissionStatus === 'reviewed' && 'Evaluado'}
        </Badge>
      </div>

      {(submissionStatus === 'draft' || isEditMode) && (
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full sm:w-auto"
          onClick={onPublishClick}
          isLoading={isPublishing}
        >
          {isPublishing ? 'Procesando...' : isEditMode ? 'Guardar Cambios' : 'Enviar y Sincronizar'}
        </Button>
      )}
    </div>
  );
});

SubmissionStatusBar.displayName = 'SubmissionStatusBar';
