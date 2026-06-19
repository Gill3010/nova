import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import type { FileInfo } from '../../../types';

interface FileUploadCardProps {
  fileKey: string;
  label: string;
  limitMB: number;
  icon: React.ReactNode;
  fileInfo: FileInfo | null;
  isLarge?: boolean;
  onRealFileUpload: (fileKey: string, e: React.ChangeEvent<HTMLInputElement>, maxMB: number) => void;
  onDeleteFile: (fileKey: string) => void;
}

export const FileUploadCard: React.FC<FileUploadCardProps> = React.memo(({
  fileKey,
  label,
  limitMB,
  icon,
  fileInfo,
  isLarge = false,
  onRealFileUpload,
  onDeleteFile
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/30 dark:bg-slate-900/10 flex flex-col gap-3.5 transition-all duration-200 hover:border-slate-350 dark:hover:border-slate-700 ${
        isLarge ? 'col-span-1 md:col-span-2' : 'col-span-1'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-zinc-400" aria-hidden="true">{icon}</span>
        <div className="flex flex-col">
          <strong className="text-sm font-semibold text-slate-800 dark:text-slate-250">{label}</strong>
          <span className="text-[10px] text-rose-500 font-medium">Límite: {limitMB} MB</span>
        </div>
      </div>

      {fileInfo ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-3 flex flex-col gap-2 relative">
          <div className="flex justify-between items-start pr-6">
            <div className="flex flex-col gap-0.5 max-w-[80%]">
              <span className="text-xs font-medium text-slate-900 dark:text-slate-200 truncate" title={fileInfo.name}>
                {fileInfo.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">({fileInfo.size} MB)</span>
            </div>
            <button
              type="button"
              className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 text-lg transition-colors p-1"
              onClick={() => onDeleteFile(fileKey)}
              aria-label={`Eliminar archivo ${fileInfo.name}`}
            >
              ×
            </button>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 bg-slate-100 dark:bg-slate-850 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${fileInfo.progress}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 shrink-0">
              {fileInfo.progress === 100 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Listo</span>
              ) : (
                `${fileInfo.progress}%`
              )}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="file"
            id={`file-${fileKey}`}
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => onRealFileUpload(fileKey, e, limitMB)}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={handleSelectClick}
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" /> Seleccionar Archivo
          </Button>
        </div>
      )}
    </div>
  );
});

FileUploadCard.displayName = 'FileUploadCard';
