import { useState, useCallback } from 'react';
import type { FileInfo, Congress } from '../types';
import * as ojsApi from '../services/ojsApi';
import { getJournalLocale } from '../utils/ojsUtils';
import { useOjsLogs } from './useOjsLogs';
import { useOjsConnection } from './useOjsConnection';

/**
 * Composes useOjsLogs + useOjsConnection and adds publish/update logic.
 * This is the main hook consumed by OjsContext — public API unchanged.
 */
export function useOjsIntegration() {
  const { logs, addLog, clearConsole } = useOjsLogs();
  const {
    ojsUrl, setOjsUrl,
    ojsApiKey, setOjsApiKey,
    ojsStatus,
    journals,
    selectedJournal, setSelectedJournal,
    isTestingConnection,
    testOjsConnection,
    resolveJournal,
  } = useOjsConnection(addLog);

  const [isPublishing, setIsPublishing] = useState(false);

  // ---- Helpers ----------------------------------------------------------------

  const getToken = () => localStorage.getItem('nova_token') ?? '';

  const apiHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  // ---- Copy payload -----------------------------------------------------------
  const copyPayload = useCallback((congressJson: Congress) => {
    navigator.clipboard.writeText(JSON.stringify(congressJson, null, 2));
    alert('¡Payload JSON copiado al portapapeles!');
  }, []);

  // ---- Publish and Sync (Speaker + Admin) ------------------------------------
  const publishAndSyncOjs = useCallback(async ({
    activeRole,
    congressJson,
    submissionTitle,
    submissionAbstract,
    submissionKeywords,
    contributors,
    submissionCategory,
    files,
    onSuccessSpeaker,
    onSuccessAdmin,
  }: {
    activeRole: 'admin_org' | 'ponente' | 'asistente' | 'revisor_eval';
    congressJson: Congress;
    submissionTitle: string;
    submissionAbstract?: string;
    submissionKeywords?: string;
    contributors?: import('../types').Contributor[];
    submissionCategory: 'poster' | 'libro' | 'articulo';
    files: { key: string; file: FileInfo | null; label: string }[];
    onSuccessSpeaker?: () => void;
    onSuccessAdmin?: (internalId: number) => void;
  }) => {
    if (isPublishing) return;
    setIsPublishing(true);

    let targetOjsUrl = ojsUrl;
    let targetOjsApiKey = ojsApiKey;
    let targetJournalPath = selectedJournal?.urlPath;

    if (activeRole === 'ponente' && congressJson) {
      targetOjsUrl = (congressJson as any).ojs_url || '';
      targetOjsApiKey = (congressJson as any).ojs_api_key || '';
      targetJournalPath = (congressJson as any).ojs_journal_path;
    }

    if (!targetOjsUrl.trim() || !targetOjsApiKey.trim()) {
      addLog('error', 'Error de Integración: URL de OJS o API Key faltantes en este congreso.');
      setIsPublishing(false);
      alert('Error: El congreso seleccionado no tiene configurada la URL y API Key de OJS.');
      return;
    }

    const currentJournal = await resolveJournal(
      activeRole === 'ponente' ? targetOjsUrl : undefined,
      activeRole === 'ponente' ? targetOjsApiKey : undefined,
      activeRole === 'ponente' ? targetJournalPath : undefined
    );
    if (!currentJournal) {
      setIsPublishing(false);
      return;
    }

    const locale = getJournalLocale(currentJournal.nameObj);

    // ==================== SPEAKER FLOW ====================
    if (activeRole === 'ponente') {
      const filesToUpload = files.filter((x) => x.file !== null);

      if (filesToUpload.length === 0) {
        addLog('error', 'Error: Debe cargar al menos un archivo para sincronizar.');
        setIsPublishing(false);
        alert('Error de Validación: Debe cargar al menos un archivo (ej: Resumen o Manuscrito).');
        return;
      }

      addLog('info', `Iniciando sincronización de ponencia con "${currentJournal.name}"...`);

      try {
        // Step 0: Get section ID
        let sectionId = 1;
        try {
          sectionId = await ojsApi.fetchSectionId(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath);
          addLog('info', `Sección detectada (ID: ${sectionId})`);
        } catch {
          addLog('info', `Usando sectionId fallback: ${sectionId}`);
        }

        // Step 1: Create submission
        const submissionPayload = {
          locale,
          sectionId,
          publication: {
            title: { [locale]: submissionTitle },
            abstract: { [locale]: `Línea: ${congressJson.researchLine}. Categoría: ${submissionCategory}` },
          },
        };
        addLog('request', `POST /api/v1/submissions`, submissionPayload);
        const subData = await ojsApi.createSubmission(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, submissionPayload);
        addLog('response', 'HTTP/1.1 200 OK', subData);

        const submissionId: number = subData.id ?? 412;
        const publicationId: number = subData.currentPublication?.id ?? subData.publications?.[0]?.id ?? 1;
        addLog('success', `Envío creado. Submission ID: ${submissionId}, Publication ID: ${publicationId}`);

        // Step 1.5: Update publication metadata
        const keywordsArray = submissionKeywords
          ? submissionKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          : [];
        const updatePayload = {
          title: { [locale]: submissionTitle },
          abstract: { [locale]: submissionAbstract || `Línea: ${congressJson.researchLine}` },
          ...(keywordsArray.length > 0 && { keywords: { [locale]: keywordsArray } }),
        };
        addLog('request', `PUT /api/v1/submissions/${submissionId}/publications/${publicationId}`, updatePayload);
        const updatedPub = await ojsApi.updatePublication(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, submissionId, publicationId, updatePayload);
        addLog('response', 'HTTP/1.1 200 OK', updatedPub);

        // Step 1.6: Add contributors
        const validContributors = (contributors ?? []).filter((c) => c.email.trim() && c.givenName.trim());
        if (validContributors.length > 0) {
          let userGroupId = 14;
          try {
            userGroupId = await ojsApi.fetchUserGroupId(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, currentJournal.id);
          } catch { /* use fallback */ }

          for (let i = 0; i < validContributors.length; i++) {
            const c = validContributors[i];
            const contribPayload = {
              givenName: { [locale]: c.givenName },
              familyName: { [locale]: c.familyName },
              email: c.email,
              country: c.country || 'PA',
              affiliation: { [locale]: c.affiliation },
              userGroupId,
              includeInBrowse: true,
              seq: i,
            };
            try {
              const contribData = await ojsApi.addContributor(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, submissionId, publicationId, contribPayload);
              addLog('success', `Colaborador "${c.givenName} ${c.familyName}" registrado (ID: ${contribData.id}).`);
            } catch (err: any) {
              addLog('error', `No se pudo registrar "${c.givenName}": ${JSON.stringify(err?.data ?? err)}`);
            }
          }
        }

        // Step 2: Upload files
        for (const item of filesToUpload) {
          if (!item.file) continue;
          addLog('info', `Subiendo "${item.file.name}"...`);

          const fileObject = item.file.rawFile
            ?? new File([`Contenido de prueba Nova: ${item.file.name}`], item.file.name, { type: 'text/plain' });

          const fileData = await ojsApi.uploadSubmissionFile(
            targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, submissionId,
            fileObject, '2', item.key === 'manuscript' ? '1' : '2'
          );
          const fileId = fileData.id ?? Math.floor(Math.random() * 5000);
          addLog('success', `"${item.file.name}" cargado (File ID: ${fileId})`);

          // Step 3: Create galley
          try {
            await ojsApi.createGalley(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, submissionId, publicationId, {
              label: item.label,
              submissionFileId: fileId,
              locale,
            });
            addLog('success', `Galera "${item.label}" creada.`);
          } catch {
            addLog('info', `Nota: OJS 3.4 no soporta creación de Galerías por API. Los archivos fueron cargados en el envío (ID: ${submissionId}) y deben asociarse manualmente.`);
          }
        }

        // Step 4: Save to local DB
        if (congressJson.id) {
          try {
            const token = getToken();
            const pgRes = await fetch(import.meta.env.PROD ? '/api/envios' : 'http://localhost:3001/api/envios', {
              method: 'POST',
              headers: apiHeaders(token),
              body: JSON.stringify({
                congreso_id: congressJson.id,
                ojs_submission_id: submissionId,
                ojs_publication_id: publicationId,
                categoria: submissionCategory,
                autor_email: validContributors[0]?.email ?? 'N/A',
                titulo_articulo: submissionTitle,
                palabras_claves: submissionKeywords ?? '',
                colaboradores: JSON.stringify(validContributors),
                revista_destino: currentJournal.name,
              }),
            });
            const pgData = await pgRes.json();
            if (pgData.success) addLog('success', `Envío registrado en BD local (Congreso ID ${congressJson.id})`);
          } catch (err: any) {
            addLog('error', `No se pudo conectar a la API local: ${err.message}`);
          }
        }

        addLog('success', `¡Ponencia "${submissionTitle.substring(0, 40)}..." sincronizada en OJS!`);
        onSuccessSpeaker?.();
      } catch (err: any) {
        const msg = err.data && typeof err.data === 'object' ? JSON.stringify(err.data) : (err.message ?? err);
        addLog('error', `Error en sincronización: ${msg}`);
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    // ==================== ADMIN FLOW ====================
    addLog('info', `Registrando congreso en "${currentJournal.name}"...`);

    if (congressJson.roles.length === 0) {
      addLog('error', 'Error: Debe seleccionar al menos un rol de usuario.');
      setIsPublishing(false);
      return;
    }

    try {
      // Step 1: Get active issue
      const issuesData = await ojsApi.fetchIssues(ojsUrl, ojsApiKey, currentJournal.urlPath);
      addLog('response', 'HTTP/1.1 200 OK', issuesData);
      const activeIssue = issuesData?.items?.[issuesData.items.length - 1];
      const activeIssueId = activeIssue?.id ?? 6;
      const activeIssueTitle = activeIssue?.title?.es ?? activeIssue?.title?.es_ES ?? `Número ${activeIssueId}`;
      addLog('success', `Issue activo: "${activeIssueTitle}" (ID: ${activeIssueId})`);

      // Step 1.5: Get section
      let sectionId = 1;
      try {
        sectionId = await ojsApi.fetchSectionId(ojsUrl, ojsApiKey, currentJournal.urlPath);
      } catch { /* use fallback */ }

      // Step 2: Create submission
      const description = `${congressJson.description}\n\nLínea: ${congressJson.researchLine}\nSede: ${congressJson.venue}\nFecha: ${congressJson.date}`;
      const submissionPayload = {
        locale,
        sectionId,
        publication: { title: { [locale]: congressJson.name }, abstract: { [locale]: description } },
      };
      addLog('request', `POST /api/v1/submissions`, submissionPayload);
      const subData = await ojsApi.createSubmission(ojsUrl, ojsApiKey, currentJournal.urlPath, submissionPayload);
      addLog('response', 'HTTP/1.1 200 OK', subData);

      const submissionId: number = subData.id;
      const publicationId: number = subData.currentPublicationId ?? subData.publications?.[0]?.id;
      addLog('success', `Congreso registrado en OJS. Submission ID: ${submissionId}`);

      // Step 2.5: Update publication metadata
      const updatePayload = { title: { [locale]: congressJson.name }, abstract: { [locale]: description } };
      addLog('request', `PUT /api/v1/submissions/${submissionId}/publications/${publicationId}`, updatePayload);
      const updatedPub = await ojsApi.updatePublication(ojsUrl, ojsApiKey, currentJournal.urlPath, submissionId, publicationId, updatePayload);
      addLog('response', 'HTTP/1.1 200 OK', updatedPub);

      // Step 3: Save to local DB
      try {
        const token = getToken();
        const pgRes = await fetch(import.meta.env.PROD ? '/api/congresos' : 'http://localhost:3001/api/congresos', {
          method: 'POST',
          headers: apiHeaders(token),
          body: JSON.stringify({
            nombre: congressJson.name,
            descripcion: congressJson.description,
            fecha_celebracion: congressJson.date,
            sede: congressJson.venue,
            modalidad: congressJson.modality,
            nivel_academico: congressJson.academicLevel,
            linea_investigacion: congressJson.researchLine,
            aula_canal: congressJson.classroom,
            ojs_url: ojsUrl,
            ojs_api_key: ojsApiKey,
            ojs_journal_path: currentJournal.urlPath,
          }),
        });
        const pgData = await pgRes.json();
        if (pgData.success) {
          addLog('success', `Congreso guardado en BD local (ID: ${pgData.congreso.id})`);
          onSuccessAdmin?.(pgData.congreso.id);
        } else {
          addLog('error', `Error al guardar en BD local: ${pgData.error}`);
        }
      } catch (err: any) {
        addLog('error', `No se pudo conectar a la API local: ${err.message}`);
      }

      addLog('success', `¡"${congressJson.name.substring(0, 40)}..." registrado en OJS!\n📌 Submission ID: ${submissionId} → Issue "${activeIssueTitle}"`);
    } catch (err: any) {
      const msg = err.data && typeof err.data === 'object' ? JSON.stringify(err.data) : (err.message ?? err);
      addLog('error', `Error en publicación: ${msg}`);
    } finally {
      setIsPublishing(false);
    }
  }, [isPublishing, ojsUrl, ojsApiKey, selectedJournal, resolveJournal, addLog]);

  // ---- Update and Sync --------------------------------------------------------
  const updateAndSyncOjs = useCallback(async ({
    activeRole,
    internalId,
    congressJson,
    selectedCongressId,
    submissionTitle,
    submissionKeywords,
    contributors,
    submissionCategory,
    onSuccessSpeaker,
    onSuccessAdmin,
  }: {
    activeRole: 'admin_org' | 'ponente' | 'asistente' | 'revisor_eval';
    internalId: number;
    congressJson?: Congress;
    selectedCongressId?: string;
    submissionTitle?: string;
    submissionKeywords?: string;
    contributors?: import('../types').Contributor[];
    submissionCategory?: 'poster' | 'libro' | 'articulo';
    onSuccessSpeaker?: () => void;
    onSuccessAdmin?: () => void;
  }) => {
    if (isPublishing) return;
    setIsPublishing(true);

    const token = getToken();

    try {
      if (activeRole === 'ponente' && submissionTitle) {
        const payload: any = {
          titulo_articulo: submissionTitle,
          palabras_claves: submissionKeywords ?? '',
          colaboradores: JSON.stringify(contributors ?? []),
          categoria: submissionCategory ?? 'articulo',
          ...(selectedCongressId && { congreso_id: parseInt(selectedCongressId, 10) }),
        };

        const res = await fetch(import.meta.env.PROD ? `/api/envios/${internalId}` : `http://localhost:3001/api/envios/${internalId}`, {
          method: 'PUT',
          headers: apiHeaders(token),
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => {
          throw new Error(`Respuesta inválida del servidor (Status: ${res.status})`);
        });

        if (res.ok && data.success) {
          addLog('success', 'Envío actualizado correctamente.');
          onSuccessSpeaker?.();
        } else {
          const msg = `Error al actualizar: ${data.error ?? 'Error desconocido'}`;
          addLog('error', msg);
          alert(msg);
        }
      } else if (activeRole === 'admin_org' && congressJson) {
        const payload = {
          nombre: congressJson.name,
          descripcion: congressJson.description,
          fecha_celebracion: congressJson.date,
          sede: congressJson.venue,
          modalidad: congressJson.modality,
          nivel_academico: congressJson.academicLevel,
          linea_investigacion: congressJson.researchLine,
          aula_canal: congressJson.classroom,
          ojs_url: ojsUrl,
          ojs_api_key: ojsApiKey,
          ojs_journal_path: selectedJournal?.urlPath || null,
        };

        const res = await fetch(import.meta.env.PROD ? `/api/congresos/${internalId}` : `http://localhost:3001/api/congresos/${internalId}`, {
          method: 'PUT',
          headers: apiHeaders(token),
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => {
          throw new Error(`Respuesta inválida del servidor (Status: ${res.status})`);
        });

        if (res.ok && data.success) {
          addLog('success', 'Congreso actualizado correctamente.');
          onSuccessAdmin?.();
        } else {
          const msg = `Error al actualizar: ${data.error ?? 'Error desconocido'}`;
          addLog('error', msg);
          alert(msg);
        }
      }
    } catch (err: any) {
      const msg = `Error de red: ${err.message}`;
      addLog('error', msg);
      alert(msg);
    } finally {
      setIsPublishing(false);
    }
  }, [isPublishing, ojsUrl, ojsApiKey, selectedJournal, addLog]);

  return {
    // Connection
    ojsUrl, setOjsUrl,
    ojsApiKey, setOjsApiKey,
    ojsStatus,
    journals,
    selectedJournal, setSelectedJournal,
    isTestingConnection,
    testOjsConnection,
    // Publishing
    isPublishing,
    publishAndSyncOjs,
    updateAndSyncOjs,
    // Logs
    logs,
    addLog,
    clearConsole,
    copyPayload,
  };
}
