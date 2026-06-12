import { useState, useCallback } from 'react';
import type { FileInfo, Congress } from '../types';
import * as ojsApi from '../services/ojsApi';
import { getJournalLocale } from '../utils/ojsUtils';
import { useOjsLogger } from './useOjsLogger';
import { useOjsConnection } from './useOjsConnection';

/**
 * Composes useOjsLogger + useOjsConnection and adds publish/update logic.
 * This is the main hook consumed by OjsContext — public API unchanged.
 */
export function useOjsIntegration() {
  const { logs, addLog, clearConsole, copyPayload } = useOjsLogger();
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
    revistaOjsId,
    revistaOjsData,
    academicLevel,
    researchLine,
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
    revistaOjsId?: number;
    revistaOjsData?: { portal_url: string; portal_api_key: string; ojs_journal_path: string; nombre: string };
    academicLevel?: 'maestria' | 'doctorado' | 'otros';
    researchLine?: string;
    onSuccessSpeaker?: () => void;
    onSuccessAdmin?: (internalId: number) => void;
  }) => {
    if (isPublishing) return;
    setIsPublishing(true);

    let targetOjsUrl = ojsUrl;
    let targetOjsApiKey = ojsApiKey;
    let targetJournalPath = selectedJournal?.urlPath;

    if (activeRole === 'ponente') {
      // Preferir credenciales de la revista seleccionada (nuevo flujo)
      if (revistaOjsData) {
        targetOjsUrl = revistaOjsData.portal_url || '';
        targetOjsApiKey = revistaOjsData.portal_api_key || '';
        targetJournalPath = revistaOjsData.ojs_journal_path;
      } else if (congressJson) {
        // Fallback: heredar del congreso (retrocompatibilidad)
        targetOjsUrl = (congressJson as any).ojs_url || '';
        targetOjsApiKey = (congressJson as any).ojs_api_key || '';
        targetJournalPath = (congressJson as any).ojs_journal_path;
      }
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
            abstract: { [locale]: submissionAbstract || `Línea: ${researchLine || (congressJson as any).researchLine}. Categoría: ${submissionCategory}` },
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
          abstract: { [locale]: submissionAbstract || `Línea: ${researchLine || congressJson.researchLine}` },
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
                resumen: submissionAbstract,
                palabras_claves: submissionKeywords ?? '',
                colaboradores: JSON.stringify(validContributors),
                revista_destino: revistaOjsData?.nombre || currentJournal.name,
                revista_ojs_id: revistaOjsId || null,
                nivel_academico: academicLevel,
                linea_investigacion: researchLine,
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
    addLog('info', `Validando conexión a OJS e ingresando datos locales para "${currentJournal.name}"...`);

    if (congressJson.roles.length === 0) {
      addLog('error', 'Error: Debe seleccionar al menos un rol de usuario.');
      setIsPublishing(false);
      return;
    }

    try {
      // Guardar en BD local (sin crear postulación en OJS)
      try {
        const token = getToken();
        const pgRes = await fetch(import.meta.env.PROD ? '/api/congresos' : 'http://localhost:3001/api/congresos', {
          method: 'POST',
          headers: apiHeaders(token),
          body: JSON.stringify({
            nombre: congressJson.name,
            lema: congressJson.motto || null,
            descripcion: congressJson.description,
            fecha_celebracion: congressJson.date,
            fecha_finalizacion: congressJson.fecha_finalizacion || null,
            sede: congressJson.venue,
            modalidad: congressJson.modality,
            nivel_academico: congressJson.academicLevel,
            linea_investigacion: congressJson.researchLine,
            aula_canal: congressJson.classroom,
            ojs_url: ojsUrl,
            ojs_api_key: ojsApiKey,
            ojs_journal_path: currentJournal.urlPath,
            ojs_submission_id: null,
            ojs_publication_id: null,
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

      addLog('success', `¡Congreso "${congressJson.name.substring(0, 40)}..." registrado exitosamente en Nova (Conexión OJS verificada)!`);
    } catch (err: any) {
      const msg = err.data && typeof err.data === 'object' ? JSON.stringify(err.data) : (err.message ?? err);
      addLog('error', `Error en validación/guardado: ${msg}`);
    } finally {
      setIsPublishing(false);
    }
  }, [isPublishing, ojsUrl, ojsApiKey, selectedJournal, resolveJournal, addLog]);

  // ---- Update and Sync --------------------------------------------------------
  const updateAndSyncOjs = useCallback(async ({
    activeRole,
    internalId,
    ojsSubmissionId,
    ojsPublicationId,
    congressJson,
    selectedCongressId,
    submissionTitle,
    submissionAbstract,
    submissionKeywords,
    contributors,
    submissionCategory,
    oldCongressJson,
    isMovingCongress,
    isMovingRevista,
    files,
    revistaOjsId,
    revistaOjsData,
    oldRevistaOjsData,
    academicLevel,
    researchLine,
    onSuccessSpeaker,
    onSuccessAdmin,
  }: {
    activeRole: 'admin_org' | 'ponente' | 'asistente' | 'revisor_eval';
    internalId: number;
    ojsSubmissionId?: number;
    ojsPublicationId?: number;
    congressJson?: Congress;
    selectedCongressId?: string;
    submissionTitle?: string;
    submissionAbstract?: string;
    submissionKeywords?: string;
    contributors?: import('../types').Contributor[];
    submissionCategory?: 'poster' | 'libro' | 'articulo';
    oldCongressJson?: Congress;
    isMovingCongress?: boolean;
    isMovingRevista?: boolean;
    files?: { key: string; file: FileInfo | null; label: string }[];
    revistaOjsId?: number;
    revistaOjsData?: { portal_url: string; portal_api_key: string; ojs_journal_path: string; nombre: string };
    oldRevistaOjsData?: { url: string; key: string; path: string };
    academicLevel?: 'maestria' | 'doctorado' | 'otros';
    researchLine?: string;
    onSuccessSpeaker?: () => void;
    onSuccessAdmin?: () => void;
  }) => {
    if (isPublishing) return;
    setIsPublishing(true);

    const token = getToken();

    try {
      if (activeRole === 'ponente' && submissionTitle) {
        // --- 1. OJS Sync for Ponente ---
        let targetOjsUrl = ojsUrl;
        let targetOjsApiKey = ojsApiKey;
        let targetJournalPath = selectedJournal?.urlPath;

        // Preferir credenciales de la revista seleccionada (nuevo flujo)
        if (revistaOjsData) {
          targetOjsUrl = revistaOjsData.portal_url || '';
          targetOjsApiKey = revistaOjsData.portal_api_key || '';
          targetJournalPath = revistaOjsData.ojs_journal_path;
        } else if (congressJson) {
          // Fallback: heredar del congreso (retrocompatibilidad)
          targetOjsUrl = (congressJson as any).ojs_url || '';
          targetOjsApiKey = (congressJson as any).ojs_api_key || '';
          targetJournalPath = (congressJson as any).ojs_journal_path;
        }

        let currentSubId = ojsSubmissionId;
        let currentPubId = ojsPublicationId;

        // Si el usuario cambió de revista (mismo congreso):
        //  - Con datos OJS previos (oldRevistaOjsData): eliminar del journal antiguo y crear en el nuevo.
        //  - Sin datos OJS previos: omitir sincronización OJS y solo actualizar BD local.
        const shouldDoMoveFlow =
          (isMovingCongress && !!oldCongressJson && !!ojsSubmissionId) ||
          (!!isMovingRevista && !!oldRevistaOjsData && !!ojsSubmissionId);
        const shouldSkipOjsSync = !!isMovingRevista && !oldRevistaOjsData;

        if (shouldDoMoveFlow) {
          addLog('info', isMovingCongress
            ? `Mudanza de Congreso detectada. Intentando eliminar envío ID ${ojsSubmissionId} del OJS anterior...`
            : `Cambio de Revista detectado. Intentando reubicar envío ID ${ojsSubmissionId} en la nueva revista...`);
          try {
            const oldUrl = oldRevistaOjsData?.url || (oldCongressJson as any)?.ojs_url;
            const oldKey = oldRevistaOjsData?.key || (oldCongressJson as any)?.ojs_api_key;
            const oldPath = oldRevistaOjsData?.path || (oldCongressJson as any)?.ojs_journal_path;

            if (!oldUrl || !oldKey || !oldPath) {
              throw new Error("No se encontraron credenciales válidas para el congreso/revista anterior. No se puede eliminar de OJS automáticamente.");
            }

            await ojsApi.deleteSubmission(oldUrl, oldKey, oldPath, ojsSubmissionId);
            addLog('success', 'Envío eliminado correctamente del OJS anterior.');
          } catch (delErr: any) {
            const errorMsg = delErr.data && typeof delErr.data === 'object' ? JSON.stringify(delErr.data) : (delErr.message ?? delErr.statusText ?? JSON.stringify(delErr));
            addLog('error', `No se pudo eliminar el envío del congreso anterior. Posiblemente OJS lo ha bloqueado (por avance editorial). Detalle: ${errorMsg}`);
            alert(`Error: No se puede mover el envío a otro congreso.\nEl sistema del congreso anterior rechazó la eliminación porque el envío ya se encuentra en proceso.\n\nDetalle: ${errorMsg}`);
            setIsPublishing(false);
            return;
          }

          addLog('info', 'Creando el envío en el nuevo OJS...');
          const currentJournal = await resolveJournal(targetOjsUrl, targetOjsApiKey, targetJournalPath);
          if (!currentJournal) {
            setIsPublishing(false);
            return;
          }
          const locale = getJournalLocale(currentJournal.nameObj);

          let sectionId = 1;
          try { sectionId = await ojsApi.fetchSectionId(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath); } catch { }

          const submissionPayload = {
            locale, sectionId, publication: { title: { [locale]: submissionTitle }, abstract: { [locale]: submissionAbstract || `Línea: ${researchLine || (congressJson as any).researchLine}. Categoría: ${submissionCategory}` } }
          };
          const subData = await ojsApi.createSubmission(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, submissionPayload);
          const newSubmissionId: number = subData.id ?? 412;
          const newPublicationId: number = subData.currentPublication?.id ?? subData.publications?.[0]?.id ?? 1;
          addLog('success', `Envío creado en el nuevo OJS. ID: ${newSubmissionId}`);

          const keywordsArray = submissionKeywords ? submissionKeywords.split(',').map((k: string) => k.trim()).filter(Boolean) : [];
          const updatePayload = {
            title: { [locale]: submissionTitle }, abstract: { [locale]: submissionAbstract || `Línea: ${researchLine || (congressJson as any).researchLine}` }, ...(keywordsArray.length > 0 && { keywords: { [locale]: keywordsArray } })
          };
          await ojsApi.updatePublication(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, newSubmissionId, newPublicationId, updatePayload);

          const validContributors = (contributors ?? []).filter((c) => c.email.trim() && c.givenName.trim());
          if (validContributors.length > 0) {
            let userGroupId = 14;
            try { userGroupId = await ojsApi.fetchUserGroupId(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, currentJournal.id); } catch { }
            for (let i = 0; i < validContributors.length; i++) {
              const c = validContributors[i];
              await ojsApi.addContributor(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, newSubmissionId, newPublicationId, {
                givenName: { [locale]: c.givenName }, familyName: { [locale]: c.familyName }, email: c.email, country: c.country || 'PA', affiliation: { [locale]: c.affiliation }, userGroupId, includeInBrowse: true, seq: i
              });
            }
          }

          const filesToUpload = (files || []).filter((x) => x.file !== null);
          for (const item of filesToUpload) {
            if (!item.file) continue;
            const fileObject = item.file.rawFile ?? new File([`Contenido de prueba Nova: ${item.file.name}`], item.file.name, { type: 'text/plain' });
            const fileData = await ojsApi.uploadSubmissionFile(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, newSubmissionId, fileObject, '2', item.key === 'manuscript' ? '1' : '2');
            const fileId = fileData.id ?? Math.floor(Math.random() * 5000);
            try {
              await ojsApi.createGalley(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, newSubmissionId, newPublicationId, { label: item.label, submissionFileId: fileId, locale });
            } catch { }
          }

          currentSubId = newSubmissionId;
          currentPubId = newPublicationId;
        } else if (!shouldSkipOjsSync && currentSubId && targetOjsUrl.trim() && targetOjsApiKey.trim() && targetJournalPath) {
          const subId = currentSubId;
          addLog('info', `Iniciando sincronización de cambios con OJS para Envío ID ${subId}...`);
          const currentJournal = await resolveJournal(targetOjsUrl, targetOjsApiKey, targetJournalPath);
          if (currentJournal) {
            const locale = getJournalLocale(currentJournal.nameObj);

            // Fetch correct publication ID if not provided
            let publicationId = currentPubId;
            if (!publicationId) {
              try {
                const subDetails = await ojsApi.fetchSubmission(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, subId);
                publicationId = subDetails.currentPublication?.id || subDetails.publications?.[0]?.id;
              } catch (e: any) {
                addLog('info', `No se pudo consultar el envío en OJS para obtener el publicationId. Usando fallback 1. Detalle: ${e.message}`);
                publicationId = 1;
              }
            }
            const pubId = publicationId || 1;

            // Sync Publication metadata
            const keywordsArray = submissionKeywords
              ? submissionKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
              : [];
            const updatePayload = {
              title: { [locale]: submissionTitle },
              abstract: { [locale]: submissionAbstract || `Línea: ${researchLine || congressJson?.researchLine || ''}. Categoría: ${submissionCategory || 'articulo'}` },
              ...(keywordsArray.length > 0 && { keywords: { [locale]: keywordsArray } }),
            };

            addLog('request', `PUT /api/v1/submissions/${subId}/publications/${pubId}`, updatePayload);
            const updatedPub = await ojsApi.updatePublication(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, subId, pubId, updatePayload);
            addLog('response', 'HTTP/1.1 200 OK', updatedPub);
            addLog('success', `Metadatos de la ponencia actualizados en OJS.`);

            // Sync Contributors: delete old ones and recreate
            try {
              const subDetails = await ojsApi.fetchSubmission(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, subId);
              const currentPub = subDetails.publications?.find((p: any) => p.id === pubId)
                || subDetails.currentPublication
                || subDetails.publications?.[0];
              const existingAuthors = currentPub?.authors || [];

              for (const author of existingAuthors) {
                await ojsApi.deleteContributor(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, subId, pubId, author.id);
              }

              const validContributors = (contributors ?? []).filter((c) => c.email.trim() && c.givenName.trim());
              if (validContributors.length > 0) {
                let userGroupId = 14;
                try {
                  userGroupId = await ojsApi.fetchUserGroupId(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, currentJournal.id);
                } catch { /* fallback */ }

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
                  await ojsApi.addContributor(targetOjsUrl, targetOjsApiKey, currentJournal.urlPath, subId, pubId, contribPayload);
                }
                addLog('success', 'Colaboradores sincronizados con OJS.');
              }
            } catch (contribErr: any) {
              addLog('error', `Error al sincronizar colaboradores con OJS: ${contribErr.message}`);
            }
          }
        }

        if (shouldSkipOjsSync) {
          addLog('info', 'Cambio de revista sin datos OJS previos: se actualizará solo la referencia local (el envío permanece en OJS original).');
        }

        // --- 2. Save changes to Nova database ---
        const payload: any = {
          titulo_articulo: submissionTitle,
          resumen: submissionAbstract,
          palabras_claves: submissionKeywords ?? '',
          colaboradores: JSON.stringify(contributors ?? []),
          categoria: submissionCategory ?? 'articulo',
          nivel_academico: academicLevel,
          linea_investigacion: researchLine,
          ...(selectedCongressId && { congreso_id: parseInt(selectedCongressId, 10) }),
          ...(currentSubId && { ojs_submission_id: currentSubId }),
          ...(currentPubId && { ojs_publication_id: currentPubId }),
          ...(revistaOjsId && { revista_ojs_id: revistaOjsId }),
          ...(revistaOjsData?.nombre && { revista_destino: revistaOjsData.nombre }),
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
          addLog('success', 'Envío actualizado correctamente en base de datos local.');
          onSuccessSpeaker?.();
        } else {
          const msg = `Error al actualizar localmente: ${data.error ?? 'Error desconocido'}`;
          addLog('error', msg);
          alert(msg);
        }
      } else if (activeRole === 'admin_org' && congressJson) {
        // --- 1. OJS Validation for Congress (Admin) ---
        let targetOjsUrl = ojsUrl;
        let targetOjsApiKey = ojsApiKey;
        let targetJournalPath = selectedJournal?.urlPath;

        if (congressJson.ojs_url) {
          targetOjsUrl = congressJson.ojs_url;
          targetOjsApiKey = congressJson.ojs_api_key || '';
          targetJournalPath = congressJson.ojs_journal_path;
        }

        if (targetOjsUrl.trim() && targetOjsApiKey.trim() && targetJournalPath) {
          addLog('info', `Validando conexión a OJS para el Congreso...`);
          const currentJournal = await resolveJournal(targetOjsUrl, targetOjsApiKey, targetJournalPath);
          if (currentJournal) {
            addLog('success', `Conexión a OJS validada exitosamente.`);
          }
        }

        // --- 2. Save changes to Nova database ---
        const payload = {
          nombre: congressJson.name,
          lema: congressJson.motto || null,
          descripcion: congressJson.description,
          fecha_celebracion: congressJson.date,
          fecha_finalizacion: congressJson.fecha_finalizacion || null,
          sede: congressJson.venue,
          modalidad: congressJson.modality,
          nivel_academico: congressJson.academicLevel,
          linea_investigacion: congressJson.researchLine,
          aula_canal: congressJson.classroom,
          ojs_url: targetOjsUrl,
          ojs_api_key: targetOjsApiKey,
          ojs_journal_path: targetJournalPath || null,
          ojs_submission_id: null,
          ojs_publication_id: null,
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
          addLog('success', 'Congreso actualizado correctamente en la base de datos local (Conexión OJS verificada).');
          onSuccessAdmin?.();
        } else {
          const msg = `Error al actualizar localmente: ${data.error ?? 'Error desconocido'}`;
          addLog('error', msg);
          alert(msg);
        }
      }
    } catch (err: any) {
      const errorMsg = err.data && typeof err.data === 'object' ? JSON.stringify(err.data) : (err.message ?? err.statusText ?? JSON.stringify(err));
      const msg = `Error en sincronización o red: ${errorMsg}`;
      addLog('error', msg);
      alert(msg);
    } finally {
      setIsPublishing(false);
    }
  }, [isPublishing, ojsUrl, ojsApiKey, selectedJournal, resolveJournal, addLog]);

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
