import React from 'react';
import { Info, FileText, Video, Volume2, Image as ImageIcon, RefreshCw, Bot } from 'lucide-react';
import { useReviewer, DEMO_FILES } from '../context/ReviewerContext';
import { Badge } from '../../../components/common/Badge';
import { ReviewerSystemReport } from './ReviewerSystemReport';

export const ReviewerFilePreviewer: React.FC = () => {
  const {
    selectedSubmission,
    activeTab,
    setActiveTab,
    fileErrorMsg,
    loadingFiles,
    ojsFiles,
    fileUrls,
    getFilePreviewSource,
    systemReport,
    loadingSystemReport,
  } = useReviewer();

  if (!selectedSubmission) return null;

  return (
    <div className="lg:col-span-7 flex flex-col gap-5 w-full">
      {/* Selector de pestañas de previsualización */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1" role="tablist">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'info'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Info className="w-3.5 h-3.5" /> Ficha
        </button>
        <button
          onClick={() => setActiveTab('manuscript')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'manuscript'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> PDF
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'video'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Video className="w-3.5 h-3.5" /> Video
        </button>
        <button
          onClick={() => setActiveTab('audio_poster')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'audio_poster'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" /> Audio/Póster
        </button>
        <button
          onClick={() => setActiveTab('system_report')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'system_report'
              ? 'bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-300 shadow-sm'
              : 'text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" /> Preliminar
        </button>
      </div>

      {/* Contenedor del visor en tiempo real */}
      <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955/20 rounded-2xl p-4 min-h-[380px] flex flex-col justify-between">
        
        {fileErrorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-amber-55/70 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs flex gap-2 animate-fade-in">
            <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-semibold block mb-0.5">Nota de Integración OJS: {fileErrorMsg}</span>
              <span>Se muestran archivos de demostración interactivos (PDF, Video, Audio) para permitir la simulación completa de la evaluación.</span>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Detalles del manuscrito
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                "{selectedSubmission.titulo_articulo}"
              </h3>
            </div>
            <div className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed max-h-56 overflow-y-auto">
              <span className="font-semibold text-slate-700 dark:text-slate-350 block mb-1">Resumen del trabajo:</span>
              <p className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800 italic">
                {selectedSubmission.resumen || 'Sin resumen proporcionado.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="default">Categoría: {selectedSubmission.categoria?.toUpperCase()}</Badge>
              <Badge variant="outline">Línea: {selectedSubmission.linea_investigacion || 'General'}</Badge>
              {selectedSubmission.nivel_academico && (
                <Badge variant="outline">Nivel: {selectedSubmission.nivel_academico}</Badge>
              )}
            </div>
            <div className="mt-3 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/40 dark:border-slate-800">
              <span className="font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">Archivos en OJS:</span>
              {loadingFiles ? (
                <span className="flex items-center gap-1.5"><RefreshCw className="h-3 w-3 animate-spin" /> Cargando archivos...</span>
              ) : ojsFiles.length === 0 ? (
                <span>Sin archivos cargados en OJS (Visualizando demos).</span>
              ) : (
                <ul className="list-disc pl-4 flex flex-col gap-0.5">
                  {ojsFiles.map((file: any) => (
                    <li key={file.id}>
                      #{file.id}: {file.name?.es || file.name?.en || 'Archivo sin nombre'} ({fileUrls[file.id] ? 'Listo' : loadingFiles ? 'Cargando' : 'No disponible'})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === 'manuscript' && (
          <div className="w-full h-[400px] flex flex-col gap-2 animate-fade-in">
            <span className="text-[10px] font-semibold text-slate-455 uppercase tracking-wider">Visor de PDF</span>
            <iframe
              src={`${getFilePreviewSource('pdf')}#toolbar=0`}
              title="Visor PDF Manuscrito"
              className="w-full h-full rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
              loading="lazy"
            />
          </div>
        )}

        {activeTab === 'video' && (
          <div className="w-full h-[400px] flex flex-col justify-center gap-2 animate-fade-in">
            <span className="text-[10px] font-semibold text-slate-455 uppercase tracking-wider">Video de Presentación</span>
            <div className="w-full h-full bg-black rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
              <video
                src={getFilePreviewSource('video')}
                controls
                className="w-full h-full max-h-[350px] object-contain"
                poster={DEMO_FILES.poster}
              />
            </div>
          </div>
        )}

        {activeTab === 'audio_poster' && (
          <div className="flex flex-col gap-5 w-full animate-fade-in">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-slate-455 uppercase tracking-wider flex items-center gap-1">
                <Volume2 className="h-3.5 w-3.5" /> Grabación de Audio (Resumen/Podcast)
              </span>
              <audio
                src={getFilePreviewSource('audio')}
                controls
                className="w-full mt-1.5 focus:outline-none"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-slate-455 uppercase tracking-wider flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" /> Afiche o Póster Asociado
              </span>
              <div className="w-full h-48 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center">
                <img
                  src={getFilePreviewSource('poster')}
                  alt="Póster del artículo"
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-250 cursor-zoom-in"
                  onClick={() => window.open(getFilePreviewSource('poster'), '_blank')}
                />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'system_report' && (
          <div className="animate-fade-in">
            <ReviewerSystemReport report={systemReport} isLoading={loadingSystemReport} />
          </div>
        )}

      </div>
    </div>
  );
};
