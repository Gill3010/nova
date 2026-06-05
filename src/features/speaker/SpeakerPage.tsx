import React, { useEffect, useState } from 'react';
import { fetchDashboardData } from '../../services/dbApi';
import type { PostgresCongress } from '../../services/dbApi';
import { useSpeaker } from '../../context/SpeakerContext';
import { useOjs } from '../../context/OjsContext';
import { useCongress } from '../../context/CongressContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import type { Contributor, FileInfo } from '../../types';

export const SpeakerPage: React.FC = () => {
  const {
    submissionTitle,
    setSubmissionTitle,
    submissionAbstract,
    setSubmissionAbstract,
    submissionKeywords,
    setSubmissionKeywords,
    contributors,
    setContributors,
    submissionCategory,
    setSubmissionCategory,
    audioFile,
    setAudioFile,
    posterFile,
    setPosterFile,
    abstractFile,
    setAbstractFile,
    manuscriptFile,
    setManuscriptFile,
    videoFile,
    setVideoFile,
    submissionStatus,
    setSubmissionStatus
  } = useSpeaker();

  const { isPublishing, publishAndSyncOjs, addLog } = useOjs();

  // --- Selector de Congreso ---
  const [availableCongresses, setAvailableCongresses] = useState<PostgresCongress[]>([]);
  const [selectedCongressId, setSelectedCongressId] = useState<string>('');
  const [isLoadingCongresses, setIsLoadingCongresses] = useState(true);

  useEffect(() => {
    const loadCongresses = async () => {
      try {
        const data = await fetchDashboardData();
        setAvailableCongresses(data);
      } catch (err) {
        console.error('Error cargando congresos:', err);
      } finally {
        setIsLoadingCongresses(false);
      }
    };
    loadCongresses();
  }, []);

  // --- Colaboradores ---
  const updateContributor = (index: number, field: keyof Contributor, value: string) => {
    setContributors(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const addContributorRow = () => {
    setContributors(prev => [...prev, { givenName: '', familyName: '', email: '', country: 'PA', affiliation: '' }]);
  };

  const removeContributorRow = (index: number) => {
    setContributors(prev => prev.filter((_, i) => i !== index));
  };

  // --- Archivos ---
  const handleFileUploadSimulated = (
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
  };

  const handleRealFileUpload = (fileKey: string, e: React.ChangeEvent<HTMLInputElement>, maxMB: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileSizeMB = parseFloat((file.size / (1024 * 1024)).toFixed(2));
    handleFileUploadSimulated(fileKey, file.name, fileSizeMB, maxMB, file);
  };

  const deleteUploadedFile = (fileKey: string) => {
    const fileSetter =
      fileKey === 'audio' ? setAudioFile
      : fileKey === 'poster' ? setPosterFile
      : fileKey === 'abstract' ? setAbstractFile
      : fileKey === 'manuscript' ? setManuscriptFile
      : setVideoFile;
    fileSetter(null);
    addLog('info', `Archivo eliminado de la categoría "${fileKey}".`);
  };

  const handlePublishClick = () => {
    if (!selectedCongressId) {
      alert('Error: Debe seleccionar un Congreso al cual postular su trabajo.');
      return;
    }

    const selectedDbCongress = availableCongresses.find(c => c.id.toString() === selectedCongressId);
    if (!selectedDbCongress) return;

    // Adaptamos el PostgresCongress a lo que espera publishAndSyncOjs
    const congressJsonToSync = {
      id: selectedDbCongress.id,
      name: selectedDbCongress.nombre,
      description: selectedDbCongress.descripcion,
      date: selectedDbCongress.fecha_celebracion,
      venue: selectedDbCongress.sede,
      modality: selectedDbCongress.modalidad as any,
      classroom: selectedDbCongress.aula_canal,
      academicLevel: selectedDbCongress.nivel_academico as any,
      researchLine: selectedDbCongress.linea_investigacion,
      roles: []
    };

    const filesList = [
      { key: 'audio', file: audioFile, label: 'Audio de Resumen' },
      { key: 'poster', file: posterFile, label: 'Póster Científico' },
      { key: 'abstract', file: abstractFile, label: 'Resumen Académico' },
      { key: 'manuscript', file: manuscriptFile, label: 'Manuscrito Completo' },
      { key: 'video', file: videoFile, label: 'Video de Presentación' }
    ];

    publishAndSyncOjs({
      activeRole: 'ponente',
      congressJson: congressJsonToSync,
      submissionTitle,
      submissionAbstract,
      submissionKeywords,
      contributors,
      submissionCategory,
      files: filesList,
      onSuccessSpeaker: () => setSubmissionStatus('submitted')
    });
  };

  const renderUploadCard = (
    fileKey: string,
    label: string,
    limitMB: number,
    icon: string,
    fileInfo: FileInfo | null,
    isLarge: boolean = false
  ) => {
    return (
      <div
        className={`border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/30 dark:bg-slate-900/10 flex flex-col gap-3.5 transition-all duration-200 hover:border-slate-350 dark:hover:border-slate-700 ${
          isLarge ? 'col-span-1 md:col-span-2' : 'col-span-1'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl select-none">{icon}</span>
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
                onClick={() => deleteUploadedFile(fileKey)}
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
              className="hidden"
              onChange={(e) => handleRealFileUpload(fileKey, e, limitMB)}
            />
            <Button
              type="button"
              variant="secondary"
              className="text-xs w-full py-2"
              onClick={() => document.getElementById(`file-${fileKey}`)?.click()}
            >
              📂 Seleccionar Archivo
            </Button>
            <div className="flex justify-between items-center gap-2 mt-1">
              <button
                type="button"
                className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-medium"
                onClick={() =>
                  handleFileUploadSimulated(
                    fileKey,
                    fileKey === 'abstract' ? 'Resumen_CambioClimatico.pdf'
                    : fileKey === 'manuscript' ? 'Articulo_Completo.docx'
                    : fileKey === 'audio' ? 'Podcast_AudioExplicativo.mp3'
                    : fileKey === 'poster' ? 'Poster_Investigacion_A0.pdf'
                    : 'Video_Exposicion_5min.mp4',
                    limitMB * 0.45,
                    limitMB
                  )
                }
              >
                Cargar Demo
              </button>
              <button
                type="button"
                className="text-[10px] text-rose-500 hover:text-rose-650 dark:text-rose-400 hover:underline font-medium"
                onClick={() =>
                  handleFileUploadSimulated(
                    fileKey,
                    fileKey === 'abstract' ? 'Resumen_Pesado.pdf'
                    : fileKey === 'manuscript' ? 'Paper_AltasFiguras.pdf'
                    : fileKey === 'audio' ? 'Podcast_Completo_Wav.wav'
                    : fileKey === 'poster' ? 'Poster_SinComprimir.png'
                    : 'Video_Raw_SinEditar.mov',
                    limitMB * 1.5,
                    limitMB
                  )
                }
              >
                Forzar Exceso
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <span className="text-2xl">🎓</span> Portal de Carga de Ponencias (Ponente)
        </h2>
      </div>

      <div className="flex flex-col gap-5">

        {/* — Selector de Congreso de Destino — */}
        <Select
          id="target-congress"
          label="Seleccione el Congreso de Destino"
          value={selectedCongressId}
          onChange={(e) => setSelectedCongressId(e.target.value)}
        >
          <option value="" disabled>
            {isLoadingCongresses ? 'Cargando congresos disponibles...' : '-- Seleccione un congreso --'}
          </option>
          {availableCongresses.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre} ({new Date(c.fecha_celebracion).toLocaleDateString()})
            </option>
          ))}
        </Select>

        {/* — Metadatos principales — */}
        <Input
          id="sub-title"
          label="Título del Trabajo Académico"
          type="text"
          value={submissionTitle}
          onChange={(e) => setSubmissionTitle(e.target.value)}
          placeholder="Ingrese el título de su investigación..."
        />

        <Select
          id="sub-category"
          label="Clasificación del Trabajo"
          value={submissionCategory}
          onChange={(e) => setSubmissionCategory(e.target.value as any)}
        >
          <option value="articulo">Artículo de Impacto (Para Revista Indexada OJS)</option>
          <option value="poster">Cartel o Póster Científico (Exposición Visual)</option>
          <option value="libro">Libro / Monografía Extensa</option>
        </Select>

        {/* — Resumen / Abstract — */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sub-abstract" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Resumen del Trabajo <span className="text-[10px] text-blue-500 font-normal ml-1">Se sincroniza como Abstract en OJS</span>
          </label>
          <textarea
            id="sub-abstract"
            rows={4}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
            value={submissionAbstract}
            onChange={(e) => setSubmissionAbstract(e.target.value)}
            placeholder="Escriba el resumen de su investigación (se guardará como Abstract en OJS)..."
          />
        </div>

        {/* — Palabras clave — */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sub-keywords" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Palabras Clave <span className="text-[10px] text-slate-400 font-normal ml-1">Separadas por comas</span>
          </label>
          <input
            id="sub-keywords"
            type="text"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={submissionKeywords}
            onChange={(e) => setSubmissionKeywords(e.target.value)}
            placeholder="ej: inteligencia artificial, medicina, algoritmos..."
          />
        </div>

        {/* — Colaboradores / Autores — */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Colaboradores / Autores <span className="text-[10px] text-blue-500 font-normal ml-1">Se registran como Authors en OJS</span>
            </label>
            <button
              type="button"
              onClick={addContributorRow}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition-colors"
            >
              + Añadir colaborador
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {contributors.map((c, i) => (
              <div
                key={i}
                className="relative border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Colaborador #{i + 1}</span>
                  {contributors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContributorRow(i)}
                      className="text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors"
                    >
                      × Eliminar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Nombre(s)</label>
                    <input
                      type="text"
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      value={c.givenName}
                      onChange={(e) => updateContributor(i, 'givenName', e.target.value)}
                      placeholder="Nombre(s)"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Apellido(s)</label>
                    <input
                      type="text"
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      value={c.familyName}
                      onChange={(e) => updateContributor(i, 'familyName', e.target.value)}
                      placeholder="Apellido(s)"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Correo electrónico <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      value={c.email}
                      onChange={(e) => updateContributor(i, 'email', e.target.value)}
                      placeholder="correo@universidad.edu"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">País (código ISO)</label>
                    <input
                      type="text"
                      maxLength={2}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition uppercase"
                      value={c.country}
                      onChange={(e) => updateContributor(i, 'country', e.target.value.toUpperCase())}
                      placeholder="PA"
                    />
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Institución / Universidad</label>
                    <input
                      type="text"
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      value={c.affiliation}
                      onChange={(e) => updateContributor(i, 'affiliation', e.target.value)}
                      placeholder="Universidad de Panamá, Facultad de Ciencias..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* — Archivos — */}
        <div className="flex flex-col gap-3 mt-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Archivos Requeridos para Postulación
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderUploadCard('abstract', 'Resumen Académico', 2, '📝', abstractFile)}
            {renderUploadCard('manuscript', 'Manuscrito Completo', 25, '📚', manuscriptFile)}
            {renderUploadCard('audio', 'Audio (Resumen / Podcast)', 10, '🎙️', audioFile)}
            {renderUploadCard('poster', 'Afiche o Póster', 15, '🖼️', posterFile)}
            {renderUploadCard('video', 'Video de Presentación (~5 min)', 50, '📹', videoFile, true)}
          </div>
        </div>

        {/* — Panel de estado y envío — */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-805 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Estado de la Ponencia:</span>
            <Badge
              variant={
                submissionStatus === 'draft' ? 'secondary' : submissionStatus === 'submitted' ? 'warning' : 'success'
              }
            >
              {submissionStatus === 'draft' && '📄 Borrador (Pendiente de Sincronizar)'}
              {submissionStatus === 'submitted' && '📤 Sincronizado en OJS (En Revisión)'}
              {submissionStatus === 'reviewed' && '✅ Evaluado'}
            </Badge>
          </div>

          {submissionStatus === 'draft' && (
            <Button
              type="button"
              variant="accent"
              className="w-full sm:w-auto font-semibold px-6 py-2.5"
              onClick={handlePublishClick}
              isLoading={isPublishing}
            >
              {isPublishing ? 'Enviando a OJS...' : 'Enviar y Sincronizar Ponencia'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
