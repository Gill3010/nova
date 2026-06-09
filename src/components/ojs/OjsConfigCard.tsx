import React from 'react';
import { Settings } from 'lucide-react';
import { useOjs } from '../../context/OjsContext';
import { useCongress } from '../../context/CongressContext';
import { useSpeaker } from '../../context/SpeakerContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';

export const OjsConfigCard: React.FC = () => {
  const {
    ojsUrl,
    setOjsUrl,
    ojsApiKey,
    setOjsApiKey,
    ojsStatus,
    journals,
    selectedJournal,
    setSelectedJournal,
    isTestingConnection,
    isPublishing,
    testOjsConnection,
    publishAndSyncOjs,
    updateAndSyncOjs,
    addLog
  } = useOjs();

  const { user } = useAuth();
  const activeRole = user?.rol === 'admin' || user?.rol === 'organizer' ? 'admin_org' : 'ponente';
  const { getCongressJson, setInternalId, internalId, setCreadorId } = useCongress();
  const {
    submissionTitle,
    submissionCategory,
    audioFile,
    posterFile,
    abstractFile,
    manuscriptFile,
    videoFile
  } = useSpeaker();

  const isEditMode = !!internalId;

  const handlePublishClick = () => {
    const filesList = [
      { key: 'audio', file: audioFile, label: 'Audio de Resumen' },
      { key: 'poster', file: posterFile, label: 'Póster Científico' },
      { key: 'abstract', file: abstractFile, label: 'Resumen Académico' },
      { key: 'manuscript', file: manuscriptFile, label: 'Manuscrito Completo' },
      { key: 'video', file: videoFile, label: 'Video de Presentación' }
    ];

    if (isEditMode) {
      if (updateAndSyncOjs) {
        updateAndSyncOjs({
          activeRole,
          internalId: internalId,
          congressJson: getCongressJson(),
          onSuccessAdmin: () => {
            alert('¡Los cambios del Congreso han sido guardados con éxito!');
          }
        });
      }
    } else {
      publishAndSyncOjs({
        activeRole,
        congressJson: getCongressJson(),
        submissionTitle,
        submissionCategory,
        files: filesList,
        onSuccessAdmin: (newInternalId) => {
          if (setInternalId) setInternalId(newInternalId);
          if (setCreadorId && user?.id) setCreadorId(user.id);
          alert('¡El Congreso ha sido creado con éxito y sincronizado con OJS!');
        }
      });
    }
  };

  return (
    <Card className="flex flex-col gap-5 w-full">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Settings className="h-4 w-4 text-zinc-400" aria-hidden="true" /> Integración OJS 3.4
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {/* Parámetros de Integración */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="ojs-url"
            label="OJS Base URL"
            type="text"
            value={ojsUrl}
            onChange={(e) => setOjsUrl(e.target.value)}
            placeholder="https://revista.universidad.edu/index.php/memorias"
          />

          <Input
            id="ojs-key"
            label="API Key (Token de OJS)"
            type="password"
            value={ojsApiKey}
            onChange={(e) => setOjsApiKey(e.target.value)}
            placeholder="Token de acceso REST API"
          />
        </div>

        {/* Estado de la Integración */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Estado de la Conexión
          </label>
          {ojsStatus === 'connected' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30 w-fit select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>● Conectado a OJS 3.4</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-900/30 text-slate-550 dark:text-slate-450 border border-slate-200 dark:border-slate-800 w-fit select-none">
              <span>○ Desconectado</span>
            </div>
          )}
        </div>

        {/* Selector de Revista Destino */}
        {ojsStatus === 'connected' && journals.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Select
              id="ojs-journal-select"
              label="Revista de Destino"
              value={selectedJournal?.id || ''}
              onChange={(e) => {
                const journalId = parseInt(e.target.value);
                const found = journals.find((j) => j.id === journalId);
                if (found) {
                  setSelectedJournal(found);
                  addLog('info', `Revista seleccionada: "${found.name}" (ID: ${found.id}, Path: ${found.urlPath})`);
                }
              }}
            >
              {journals.map((j) => (
                <option key={j.id} value={j.id} disabled={!j.enabled}>
                  {j.name} {!j.enabled ? '(Deshabilitada en OJS)' : ''}
                </option>
              ))}
            </Select>
            {selectedJournal && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                Las ponencias y congresos se registrarán en:{' '}
                <a
                  href={selectedJournal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-semibold break-all"
                >
                  {selectedJournal.url}
                </a>
              </p>
            )}
          </div>
        )}

        {/* Acciones de Sincronización */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Button
            type="button"
            variant="secondary"
            className="text-xs font-semibold py-2.5"
            onClick={testOjsConnection}
            disabled={isTestingConnection || isPublishing}
          >
            {isTestingConnection ? 'Comprobando...' : 'Probar Conexión'}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePublishClick}
            disabled={isPublishing || isTestingConnection || (!selectedJournal && !isEditMode)}
          >
            {isPublishing ? 'Procesando...' : isEditMode ? 'Guardar Cambios' : 'Publicar en OJS'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
