import { useCallback } from 'react';
import type { FileInfo } from '../../../types';

interface FileSetters {
  setAudioFile: (file: FileInfo | null | ((prev: FileInfo | null) => FileInfo | null)) => void;
  setPosterFile: (file: FileInfo | null | ((prev: FileInfo | null) => FileInfo | null)) => void;
  setAbstractFile: (file: FileInfo | null | ((prev: FileInfo | null) => FileInfo | null)) => void;
  setManuscriptFile: (file: FileInfo | null | ((prev: FileInfo | null) => FileInfo | null)) => void;
  setVideoFile: (file: FileInfo | null | ((prev: FileInfo | null) => FileInfo | null)) => void;
}

export function useFileHandlers(
  {
    setAudioFile,
    setPosterFile,
    setAbstractFile,
    setManuscriptFile,
    setVideoFile,
  }: FileSetters,
  addLog: (type: 'info' | 'success' | 'error' | 'request' | 'response', message: string, payload?: any) => void
) {
  const handleFileUploadSimulated = useCallback((
    fileKey: string,
    fileName: string,
    fileSizeMB: number,
    maxMB: number,
    actualFile?: File
  ) => {
    if (fileSizeMB > maxMB) {
      alert(`Error de Límite: El archivo "${fileName}" pesa ${fileSizeMB} MB, lo cual excede el límite máximo permitido de ${maxMB} MB para este campo.`);
      addLog('error', `Error de carga: "${fileName}" excede el límite de ${maxMB} MB (Peso: ${fileSizeMB} MB).`);
      return;
    }

    const fileSetter =
      fileKey === 'audio' ? setAudioFile
        : fileKey === 'poster' ? setPosterFile
          : fileKey === 'abstract' ? setAbstractFile
            : fileKey === 'manuscript' ? setManuscriptFile
              : setVideoFile;

    const initialFile: FileInfo = {
      name: fileName,
      size: fileSizeMB,
      type: fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN',
      progress: 0,
      rawFile: actualFile
    };
    fileSetter(initialFile);

    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.floor(Math.random() * 25) + 15;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        addLog('success', `Archivo "${fileName}" (${fileSizeMB} MB) cargado localmente con éxito.`);
      }
      fileSetter((prev) => (prev ? { ...prev, progress: prog } : null));
    }, 150);
  }, [setAudioFile, setPosterFile, setAbstractFile, setManuscriptFile, setVideoFile, addLog]);

  const handleRealFileUpload = useCallback((fileKey: string, e: React.ChangeEvent<HTMLInputElement>, maxMB: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileSizeMB = parseFloat((file.size / (1024 * 1024)).toFixed(2));
    handleFileUploadSimulated(fileKey, file.name, fileSizeMB, maxMB, file);
  }, [handleFileUploadSimulated]);

  const deleteUploadedFile = useCallback((fileKey: string) => {
    const fileSetter =
      fileKey === 'audio' ? setAudioFile
        : fileKey === 'poster' ? setPosterFile
          : fileKey === 'abstract' ? setAbstractFile
            : fileKey === 'manuscript' ? setManuscriptFile
              : setVideoFile;
    fileSetter(null);
    addLog('info', `Archivo eliminado de la categoría "${fileKey}".`);
  }, [setAudioFile, setPosterFile, setAbstractFile, setManuscriptFile, setVideoFile, addLog]);

  return {
    handleFileUploadSimulated,
    handleRealFileUpload,
    deleteUploadedFile,
  };
}
