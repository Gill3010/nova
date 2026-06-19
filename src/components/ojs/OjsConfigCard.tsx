import React from 'react';
import { Settings } from 'lucide-react';
import { useOjs } from '../../context/OjsContext';
import { useCongress } from '../../context/CongressContext';
import { useSpeaker } from '../../context/SpeakerContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { createPortalOjs, syncRevistasPortal, associatePortalToCongress } from '../../services/dbApi';

export const OjsConfigCard: React.FC = () => {
  const {
    ojsUrl,
    setOjsUrl,
    ojsApiKey,
    setOjsApiKey,
    ojsStatus,
    journals,
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

  const handlePublishClick = async () => {
    const filesList = [
      { key: 'audio', file: audioFile, label: 'Audio de Resumen' },
      { key: 'poster', file: posterFile, label: 'Póster Científico' },
      { key: 'abstract', file: abstractFile, label: 'Resumen Académico' },
      { key: 'manuscript', file: manuscriptFile, label: 'Manuscrito Completo' },
      { key: 'video', file: videoFile, label: 'Video de Presentación' }
    ];

    // Persistir portal OJS y sincronizar revistas si estamos conectados
    let portalOjsId: number | undefined;
    if (ojsUrl.trim() && ojsApiKey.trim() && ojsStatus === 'connected') {
      try {
        // 1. Crear/actualizar portal
        const portalRes = await createPortalOjs({
          ojs_url: ojsUrl.trim(),
          ojs_api_key: ojsApiKey.trim(),
          nombre: ojsUrl.trim()
        });
        if (portalRes.success && portalRes.portal) {
          const currentPortalId = portalRes.portal.id;
          portalOjsId = currentPortalId;
          addLog('success', `Portal OJS registrado (ID: ${currentPortalId})`);

          // 2. Sincronizar revistas detectadas
          if (journals.length > 0) {
            const revistasToSync = journals.map(j => ({
              ojs_journal_path: j.urlPath,
              ojs_journal_id: j.id,
              nombre: j.name,
              url: j.url,
              habilitada: j.enabled
            }));
            await syncRevistasPortal(currentPortalId, revistasToSync);
            addLog('success', `${journals.length} revista(s) sincronizada(s) en el portal`);
          }

          // 3. Asociar al congreso actual si estamos editando
          if (internalId) {
            await associatePortalToCongress(currentPortalId, internalId);
            addLog('success', `Portal OJS asociado al congreso (ID: ${internalId})`);
          }
        }
      } catch (err: any) {
        addLog('error', `Error al persistir portal OJS: ${err.message}`);
      }
    }

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
        onSuccessAdmin: async (newInternalId) => {
          if (setInternalId) setInternalId(newInternalId);
          if (setCreadorId && user?.id) setCreadorId(user.id);

          // Asociar portal al congreso recién creado
          if (portalOjsId && newInternalId) {
            try {
              await associatePortalToCongress(portalOjsId, newInternalId);
              addLog('success', `Portal OJS asociado al nuevo congreso (ID: ${newInternalId})`);
            } catch (err: any) {
              addLog('error', `Error al asociar portal al congreso: ${err.message}`);
            }
          }

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

        {/* Revistas Detectadas */}
        {ojsStatus === 'connected' && journals.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Revistas Sincronizadas ({journals.length})
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Se han detectado {journals.length} revistas en este portal. Las credenciales de este portal se asociarán al congreso y los ponentes podrán seleccionar la revista a la cual desean enviar su trabajo al momento de enviar su ponencia.
            </p>
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
            disabled={isPublishing || isTestingConnection || (ojsStatus !== 'connected' && !isEditMode)}
          >
            {isPublishing ? 'Procesando...' : isEditMode ? 'Guardar Cambios' : 'Publicar en OJS'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
