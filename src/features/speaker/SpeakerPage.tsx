import React, { useEffect, useState, useCallback } from 'react';
import { GraduationCap, FileText, BookOpen, Mic, Image, Video } from 'lucide-react';
import { fetchDashboardData, fetchRevistasForCongress } from '../../services/dbApi';
import type { PostgresCongress } from '../../services/dbApi';
import { useSpeaker } from '../../context/SpeakerContext';
import { useOjs } from '../../context/OjsContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import type { Contributor, FileInfo } from '../../types';
import { DEFAULT_RESEARCH_LINES } from '../../constants/data';
import { useTour } from '../onboarding';

// Subcomponents
import { FileUploadCard } from './components/FileUploadCard';
import { ContributorsSection } from './components/ContributorsSection';
import { SubmissionStatusBar } from './components/SubmissionStatusBar';

export const SpeakerPage: React.FC = () => {
  const { user } = useAuth();

  // ── Product Tour del Ponente ──────────────────────────────────────────────
  // autoStart: true → se dispara automáticamente si el usuario no lo ha visto.
  // El hook comprueba localStorage; si ya fue completado, no hace nada.
  useTour({
    role: 'speaker',
    userId: user?.id ?? 0,
    autoStart: true,
  });

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
    setSubmissionStatus,
    resetSpeakerForm,
    internalSubmissionId,
    ojsSubmissionId,
    ojsPublicationId,
    selectedCongressId,
    originalCongressId,
    setSelectedCongressId,
    originalRevistaOjsData,
    originalRevistaOjsId,
    selectedRevistaOjsId,
    setSelectedRevistaOjsId,
    academicLevel,
    setAcademicLevel,
    researchLine,
    setResearchLine
  } = useSpeaker();

  const { isPublishing, publishAndSyncOjs, updateAndSyncOjs, addLog } = useOjs();

  const isEditMode = !!internalSubmissionId;
  const isMovingCongress = isEditMode && !!internalSubmissionId && !!originalCongressId && selectedCongressId !== originalCongressId;
  // isMovingRevista: el congreso es el mismo pero el usuario seleccionó una revista diferente
  const isMovingRevista = isEditMode && !!internalSubmissionId && !!originalRevistaOjsId && selectedRevistaOjsId !== originalRevistaOjsId;

  // --- Selector de Congreso ---
  const [availableCongresses, setAvailableCongresses] = useState<PostgresCongress[]>([]);
  const [isLoadingCongresses, setIsLoadingCongresses] = useState(true);
  const [availableRevistas, setAvailableRevistas] = useState<any[]>([]);
  const [isLoadingRevistas, setIsLoadingRevistas] = useState(false);

  useEffect(() => {
    const loadCongresses = async () => {
      try {
        const data = await fetchDashboardData('all');
        setAvailableCongresses(data);
      } catch (err) {
        console.error('Error cargando congresos:', err);
      } finally {
        setIsLoadingCongresses(false);
      }
    };
    loadCongresses();
  }, []);

  // Cargar revistas disponibles cuando se selecciona un congreso
  useEffect(() => {
    if (!selectedCongressId) {
      setAvailableRevistas([]);
      return;
    }
    const loadRevistas = async () => {
      setIsLoadingRevistas(true);
      try {
        const data = await fetchRevistasForCongress(parseInt(selectedCongressId, 10));
        setAvailableRevistas(data);
        // Auto-seleccionar si solo hay una revista o si ya hay una seleccionada
        if (data.length === 1 && !selectedRevistaOjsId) {
          setSelectedRevistaOjsId(data[0].id);
        } else if (selectedRevistaOjsId && !data.find((r: any) => r.id === selectedRevistaOjsId)) {
          // Si la revista seleccionada no está en la lista, limpiar
          setSelectedRevistaOjsId(undefined);
        }
      } catch (err) {
        console.error('Error cargando revistas:', err);
        setAvailableRevistas([]);
      } finally {
        setIsLoadingRevistas(false);
      }
    };
    loadRevistas();
  }, [selectedCongressId]);

  // --- Colaboradores (memoizados) ---
  const updateContributor = useCallback((index: number, field: keyof Contributor, value: string) => {
    setContributors(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  }, [setContributors]);

  const addContributorRow = useCallback(() => {
    setContributors(prev => [...prev, { givenName: '', familyName: '', email: '', country: 'PA', affiliation: '' }]);
  }, [setContributors]);

  const removeContributorRow = useCallback((index: number) => {
    setContributors(prev => prev.filter((_, i) => i !== index));
  }, [setContributors]);

  // --- Archivos (memoizados) ---
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

  const handlePublishClick = useCallback(() => {
    if (!selectedCongressId) {
      alert('Error: Debe seleccionar un Congreso al cual postular su trabajo.');
      return;
    }

    // Resolver datos de la revista seleccionada
    let revistaOjsData: { portal_url: string; portal_api_key: string; ojs_journal_path: string; nombre: string } | undefined;
    if (selectedRevistaOjsId) {
      const revista = availableRevistas.find((r: any) => r.id === selectedRevistaOjsId);
      if (revista) {
        revistaOjsData = {
          portal_url: revista.portal_url,
          portal_api_key: revista.portal_api_key,
          ojs_journal_path: revista.ojs_journal_path,
          nombre: revista.nombre || revista.ojs_journal_path
        };
      }
    }

    // Validar: si hay revistas disponibles, el ponente debe seleccionar una
    if (availableRevistas.length > 0 && !selectedRevistaOjsId) {
      alert('Error: Debe seleccionar una Revista de destino para su trabajo.');
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
      roles: [],
      ojs_url: selectedDbCongress.ojs_url,
      ojs_api_key: selectedDbCongress.ojs_api_key,
      ojs_journal_path: selectedDbCongress.ojs_journal_path
    };

    const filesList = [
      { key: 'audio', file: audioFile, label: 'Audio de Resumen' },
      { key: 'poster', file: posterFile, label: 'Póster Científico' },
      { key: 'abstract', file: abstractFile, label: 'Resumen Académico' },
      { key: 'manuscript', file: manuscriptFile, label: 'Manuscrito Completo' },
      { key: 'video', file: videoFile, label: 'Video de Presentación' }
    ];

    if (isMovingCongress) {
      const hasFiles = filesList.some(f => f.file !== null);
      if (!hasFiles) {
        alert('Error: Al mover un envío a un nuevo congreso, debe seleccionar nuevamente al menos un archivo para subir (ya que los archivos originales se encuentran en el servidor del congreso anterior).');
        return;
      }
    }

    let oldCongressJsonToSync = undefined;
    if (isMovingCongress) {
      const oldDbCongress = availableCongresses.find(c => c.id.toString() === originalCongressId);
      if (oldDbCongress) {
        oldCongressJsonToSync = {
          id: oldDbCongress.id,
          name: oldDbCongress.nombre,
          description: oldDbCongress.descripcion,
          date: oldDbCongress.fecha_celebracion,
          venue: oldDbCongress.sede,
          modality: oldDbCongress.modalidad as any,
          classroom: oldDbCongress.aula_canal,
          academicLevel: oldDbCongress.nivel_academico as any,
          researchLine: oldDbCongress.linea_investigacion,
          roles: [],
          ojs_url: oldDbCongress.ojs_url,
          ojs_api_key: oldDbCongress.ojs_api_key,
          ojs_journal_path: oldDbCongress.ojs_journal_path
        };
      }
    }

    if (isEditMode && internalSubmissionId) {
      if (updateAndSyncOjs) {
        updateAndSyncOjs({
          activeRole: 'ponente',
          internalId: internalSubmissionId,
          ojsSubmissionId,
          ojsPublicationId,
          selectedCongressId,
          submissionTitle,
          submissionAbstract,
          submissionKeywords,
          contributors,
          submissionCategory,
          congressJson: congressJsonToSync,
          oldCongressJson: oldCongressJsonToSync,
          isMovingCongress,
          isMovingRevista,
          files: filesList,
          revistaOjsId: selectedRevistaOjsId,
          revistaOjsData,
          oldRevistaOjsData: originalRevistaOjsData,
          academicLevel,
          researchLine,
          onSuccessSpeaker: () => {
            alert('¡Los cambios de su ponencia han sido guardados con éxito!');
            resetSpeakerForm();
            setSelectedCongressId('');
            setSelectedRevistaOjsId(undefined);
          }
        });
      }
    } else {
      publishAndSyncOjs({
        activeRole: 'ponente',
        congressJson: congressJsonToSync,
        submissionTitle,
        submissionAbstract,
        submissionKeywords,
        contributors,
        submissionCategory,
        files: filesList,
        revistaOjsId: selectedRevistaOjsId,
        revistaOjsData,
        academicLevel,
        researchLine,
        onSuccessSpeaker: () => {
          setSubmissionStatus('submitted');
          alert('¡Su ponencia ha sido enviada con éxito y sincronizada con OJS!');
          resetSpeakerForm();
          setSelectedCongressId('');
          setSelectedRevistaOjsId(undefined);
        }
      });
    }
  }, [
    selectedCongressId,
    originalCongressId,
    selectedRevistaOjsId,
    availableCongresses,
    availableRevistas,
    isEditMode,
    isMovingCongress,
    isMovingRevista,
    originalRevistaOjsId,
    internalSubmissionId,
    ojsSubmissionId,
    ojsPublicationId,
    submissionTitle,
    submissionAbstract,
    submissionKeywords,
    contributors,
    submissionCategory,
    audioFile,
    posterFile,
    abstractFile,
    manuscriptFile,
    videoFile,
    updateAndSyncOjs,
    publishAndSyncOjs,
    resetSpeakerForm,
    setSelectedCongressId,
    setSelectedRevistaOjsId,
    setSubmissionStatus,
    academicLevel,
    researchLine
  ]);

  return (
    <Card className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
          <GraduationCap className="h-5 w-5 text-zinc-500" aria-hidden="true" /> Portal de Ponencias
        </h2>
      </div>

      <div className="flex flex-col gap-5">

        {/* — Selector de Congreso de Destino — */}
        {/* data-tour-id: referenciado en el paso 1 del tour del Ponente */}
        <div data-tour-id="speaker-congress-selector">
        <Select
          id="target-congress"
          label="Seleccione el Congreso de Destino"
          value={selectedCongressId}
          onChange={(e) => {
            setSelectedCongressId(e.target.value);
            setSelectedRevistaOjsId(undefined); // Limpiar revista al cambiar congreso
          }}
        >
          <option value="" disabled>
            {isLoadingCongresses ? 'Cargando congresos disponibles...' : '-- Seleccione un congreso --'}
          </option>
          {availableCongresses.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre} ({new Date(c.fecha_celebracion).toLocaleDateString()}
              {c.fecha_finalizacion && c.fecha_finalizacion !== c.fecha_celebracion ? ` al ${new Date(c.fecha_finalizacion).toLocaleDateString()}` : ''})
            </option>
          ))}
        </Select>
        </div>

        {/* — Selector de Revista de Destino (nuevo) — */}
        {selectedCongressId && (
          <Select
            id="target-revista"
            label="Seleccione la Revista de Destino"
            value={selectedRevistaOjsId ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedRevistaOjsId(val ? parseInt(val, 10) : undefined);
            }}
          >
            <option value="" disabled>
              {isLoadingRevistas
                ? 'Cargando revistas disponibles...'
                : availableRevistas.length === 0
                  ? 'No hay revistas configuradas para este congreso'
                  : '-- Seleccione una revista --'}
            </option>
            {availableRevistas.map((r: any) => (
              <option key={r.id} value={r.id} disabled={!r.habilitada}>
                {r.nombre || r.ojs_journal_path} {!r.habilitada ? '(No publicada)' : ''}
              </option>
            ))}
          </Select>
        )}

        {/* — Metadatos principales — */}
        {/* data-tour-id: referenciado en el paso 2 del tour del Ponente */}
        <div data-tour-id="speaker-submission-title">
        <Input
          id="sub-title"
          label="Título del Trabajo Académico"
          type="text"
          value={submissionTitle}
          onChange={(e) => setSubmissionTitle(e.target.value)}
          placeholder="Ingrese el título de su investigación..."
        />
        </div>

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

        {/* — Nivel Académico — */}
        <Select
          id="sub-academic-level"
          label="Nivel Académico"
          value={academicLevel}
          onChange={(e) => setAcademicLevel(e.target.value as 'maestria' | 'doctorado' | 'otros')}
        >
          <option value="maestria">Maestría (Enfoque en formación académica y profesional)</option>
          <option value="doctorado">Doctorado (Enfoque en alta investigación original)</option>
          <option value="otros">Otros (Seminarios, cursos o grado general)</option>
        </Select>

        {/* — Línea de Investigación — */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sub-research-line" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Línea de Investigación
          </label>
          <Select
            id="sub-research-line"
            value={DEFAULT_RESEARCH_LINES.some(l => l.name === researchLine) ? researchLine : (researchLine ? 'Otro' : '')}
            onChange={(e) => {
              const val = e.target.value;
              if (val !== 'Otro') {
                setResearchLine(val);
              } else {
                setResearchLine('');
              }
            }}
          >
            <option value="" disabled>-- Seleccione una línea de investigación --</option>
            {DEFAULT_RESEARCH_LINES.map(line => (
              <option key={line.id} value={line.name}>{line.name}</option>
            ))}
            <option value="Otro">Otro (Especificar)</option>
          </Select>

          {/* Input para línea de investigación personalizada si no coincide con las predefinidas o es "Otro" */}
          {(!DEFAULT_RESEARCH_LINES.some(l => l.name === researchLine) || (researchLine && !DEFAULT_RESEARCH_LINES.some(l => l.name === researchLine))) && (
            <Input
              id="sub-research-line-custom"
              type="text"
              label="Especifique la Línea de Investigación"
              value={researchLine}
              onChange={(e) => setResearchLine(e.target.value)}
              placeholder="Escriba su línea de investigación personalizada..."
            />
          )}
        </div>

        {/* — Colaboradores / Autores (extraído) — */}
        <ContributorsSection
          contributors={contributors}
          onUpdateContributor={updateContributor}
          onAddContributor={addContributorRow}
          onRemoveContributor={removeContributorRow}
        />

        {/* — Archivos (extraído y mapeado) — */}
        <div className="flex flex-col gap-3 mt-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Archivos Requeridos para Postulación
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FileUploadCard
              fileKey="abstract"
              label="Resumen Académico"
              limitMB={2}
              icon={<FileText className="h-5 w-5" />}
              fileInfo={abstractFile}
              onUploadSimulated={handleFileUploadSimulated}
              onRealFileUpload={handleRealFileUpload}
              onDeleteFile={deleteUploadedFile}
            />
            {/* data-tour-id: referenciado en el paso 3 del tour del Ponente */}
            <div data-tour-id="speaker-file-manuscript">
            <FileUploadCard
              fileKey="manuscript"
              label="Manuscrito Completo"
              limitMB={25}
              icon={<BookOpen className="h-5 w-5" />}
              fileInfo={manuscriptFile}
              onUploadSimulated={handleFileUploadSimulated}
              onRealFileUpload={handleRealFileUpload}
              onDeleteFile={deleteUploadedFile}
            />
            </div>
            <FileUploadCard
              fileKey="audio"
              label="Audio (Resumen / Podcast)"
              limitMB={10}
              icon={<Mic className="h-5 w-5" />}
              fileInfo={audioFile}
              onUploadSimulated={handleFileUploadSimulated}
              onRealFileUpload={handleRealFileUpload}
              onDeleteFile={deleteUploadedFile}
            />
            {/* data-tour-id: referenciado en el paso 4 del tour del Ponente */}
            <div data-tour-id="speaker-file-poster">
            <FileUploadCard
              fileKey="poster"
              label="Afiche o Póster"
              limitMB={15}
              icon={<Image className="h-5 w-5" />}
              fileInfo={posterFile}
              onUploadSimulated={handleFileUploadSimulated}
              onRealFileUpload={handleRealFileUpload}
              onDeleteFile={deleteUploadedFile}
            />
            </div>
            <FileUploadCard
              fileKey="video"
              label="Video de Presentación (~5 min)"
              limitMB={50}
              icon={<Video className="h-5 w-5" />}
              fileInfo={videoFile}
              isLarge={true}
              onUploadSimulated={handleFileUploadSimulated}
              onRealFileUpload={handleRealFileUpload}
              onDeleteFile={deleteUploadedFile}
            />
          </div>
        </div>

        {/* — Panel de estado y envío (extraído) — */}
        {/* data-tour-id: referenciado en el paso 5 del tour del Ponente */}
        <div data-tour-id="speaker-submit-btn">
        <SubmissionStatusBar
          submissionStatus={submissionStatus}
          isEditMode={isEditMode}
          isPublishing={isPublishing}
          onPublishClick={handlePublishClick}
        />
        </div>
      </div>
    </Card>
  );
};
