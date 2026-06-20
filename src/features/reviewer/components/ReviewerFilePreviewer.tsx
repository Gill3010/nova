import React from 'react';
import { Info, FileText, Video, Volume2, Image as ImageIcon, RefreshCw, Bot, AlertTriangle } from 'lucide-react';
import { useReviewer, DEMO_FILES } from '../context/ReviewerContext';
import { Badge } from '../../../components/common/Badge';
import { ReviewerSystemReport } from './ReviewerSystemReport';

/** Placeholder que se muestra cuando no hay fuente de archivo disponible */
const NoFileAvailable: React.FC<{ label: string }> = ({ label }) => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 py-12">
    <AlertTriangle className="h-8 w-8 text-slate-300 dark:text-slate-600" />
    <span className="text-xs font-medium text-center max-w-xs">
      {label} no disponible. Revise el error de OJS arriba para más detalles.
    </span>
  </div>
);

export const ReviewerFilePreviewer: React.FC = () => {
  const {
    selectedSubmission,
    activeTab,
    setActiveTab,
    fileErrorMsg,
    useDemoFiles,
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
        
        {/* Banner de error real de OJS — muestra el mensaje/código exacto */}
        {fileErrorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50/80 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50 text-red-800 dark:text-red-300 text-xs flex gap-2 animate-fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Error de OJS al cargar archivos:</span>
              <code className="block bg-red-100/60 dark:bg-red-900/30 p-1.5 rounded text-[11px] font-mono break-all mt-1">
                {fileErrorMsg}
              </code>
              <span className="block mt-1.5 text-red-600/80 dark:text-red-400/70">
                Los archivos reales de OJS no pudieron cargarse. Verifique los permisos del API Key, el rol del usuario en OJS, y que la submission exista.
              </span>
            </div>
          </div>
        )}

        {/* Banner informativo de modo demo (solo cuando no hay credenciales OJS configuradas) */}
        {useDemoFiles && !fileErrorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50/70 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 text-xs flex gap-2 animate-fade-in">
            <Info className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
            <div>
              <span className="font-semibold block mb-0.5">Modo demostración</span>
              <span>No hay credenciales OJS configuradas para este envío. Se muestran archivos de demostración.</span>
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
                <span>{useDemoFiles ? 'Sin credenciales OJS — visualizando demos.' : 'Sin archivos encontrados en OJS.'}</span>
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
            {getFilePreviewSource('pdf') ? (
              <iframe
                src={`${getFilePreviewSource('pdf')}#toolbar=0`}
                title="Visor PDF Manuscrito"
                className="w-full h-full rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                loading="lazy"
              />
            ) : (
              <NoFileAvailable label="Manuscrito PDF" />
            )}
          </div>
        )}

        {activeTab === 'video' && (
          <div className="w-full h-[400px] flex flex-col justify-center gap-2 animate-fade-in">
            <span className="text-[10px] font-semibold text-slate-455 uppercase tracking-wider">Video de Presentación</span>
            <div className="w-full h-full bg-black rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
              {getFilePreviewSource('video') ? (
                <video
                  src={getFilePreviewSource('video')}
                  controls
                  className="w-full h-full max-h-[350px] object-contain"
                  poster={useDemoFiles ? DEMO_FILES.poster : undefined}
                />
              ) : (
                <NoFileAvailable label="Video de presentación" />
              )}
            </div>
          </div>
        )}

        {activeTab === 'audio_poster' && (
          <div className="flex flex-col gap-5 w-full animate-fade-in">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-slate-455 uppercase tracking-wider flex items-center gap-1">
                <Volume2 className="h-3.5 w-3.5" /> Grabación de Audio (Resumen/Podcast)
              </span>
              {getFilePreviewSource('audio') ? (
                <audio
                  src={getFilePreviewSource('audio')}
                  controls
                  className="w-full mt-1.5 focus:outline-none"
                />
              ) : (
                <NoFileAvailable label="Grabación de audio" />
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-slate-455 uppercase tracking-wider flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" /> Afiche o Póster Asociado
              </span>
              <div className="w-full h-48 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center">
                {getFilePreviewSource('poster') ? (
                  <img
                    src={getFilePreviewSource('poster')}
                    alt="Póster del artículo"
                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-250 cursor-zoom-in"
                    onClick={() => window.open(getFilePreviewSource('poster'), '_blank')}
                  />
                ) : (
                  <NoFileAvailable label="Póster" />
                )}
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
