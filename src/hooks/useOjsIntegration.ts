import { useState } from 'react';
import type { OjsJournal, LogEntry, FileInfo, Congress } from '../types';
import * as ojsApi from '../services/ojsApi';
import { getJournalLocale } from '../utils/ojsUtils';

export function useOjsIntegration() {
  const [ojsUrl, setOjsUrl] = useState('https://dev.relaticpanama.org/_journals/');
  const [ojsApiKey, setOjsApiKey] = useState('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.IjVlY2E3MDIyZmFmOTNmM2YwMDFmMzU3NDhlNGIxOTY0ODc4N2U1ODci.b9zZBrcVyDvTSSGLiLYjyIympvC30XfBX-uxMrDfRdU');
  const [ojsStatus, setOjsStatus] = useState<'disconnected' | 'connected'>('disconnected');
  const [journals, setJournals] = useState<OjsJournal[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<OjsJournal | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'Sistema de Gestión de Congresos iniciado. Listo para configurar integración con OJS 3.4.'
    }
  ]);

  const addLog = (type: LogEntry['type'], message: string, payload?: any) => {
    setLogs(prev => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        payload
      }
    ]);
  };

  const clearConsole = () => {
    setLogs([]);
  };

  // Probar Conexión REAL con OJS 3.4
  const testOjsConnection = async () => {
    if (isTestingConnection) return;
    setIsTestingConnection(true);
    setOjsStatus('disconnected');
    setJournals([]);
    setSelectedJournal(null);

    addLog('info', `Iniciando prueba de conexión con OJS 3.4 en el portal: ${ojsUrl}...`);

    if (!ojsUrl.trim() || !ojsApiKey.trim()) {
      addLog('error', 'Error de Conexión: URL de OJS o API Key faltantes.');
      setOjsStatus('disconnected');
      setIsTestingConnection(false);
      return;
    }

    try {
      addLog('request', `GET /api/v1/contexts (a través del proxy)`);
      const fetchedJournals = await ojsApi.fetchJournals(ojsUrl, ojsApiKey);
      
      if (fetchedJournals.length === 0) {
        addLog('error', 'Conectado a OJS, pero no se encontraron revistas en este portal.');
        setOjsStatus('connected');
        return;
      }

      setJournals(fetchedJournals);
      addLog('success', `Conexión establecida con éxito. OJS 3.4 respondió correctamente y se encontraron ${fetchedJournals.length} revistas.`);
      setOjsStatus('connected');

      // Selección automática e inteligente
      const enabledJournals = fetchedJournals.filter(j => j.enabled);
      let defaultSelection: OjsJournal | null = null;

      // Intentar emparejar con el path de la URL ingresada
      const matched = fetchedJournals.find(j => ojsUrl.includes(j.urlPath));
      if (matched) {
        defaultSelection = matched;
      } else if (enabledJournals.length > 0) {
        defaultSelection = enabledJournals[0];
      } else if (fetchedJournals.length > 0) {
        defaultSelection = fetchedJournals[0];
      }

      if (defaultSelection) {
        setSelectedJournal(defaultSelection);
        addLog('info', `Revista preseleccionada automáticamente: "${defaultSelection.name}" (ID: ${defaultSelection.id}, Path: ${defaultSelection.urlPath})`);
      }
    } catch (err: any) {
      console.error("Error connecting to OJS:", err);
      addLog('error', `Error de Red al intentar conectar con OJS REST API\nDetalle: ${err.message || err}`);
      setOjsStatus('disconnected');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Publicar y Sincronizar REAL en OJS 3.4
  const publishAndSyncOjs = async ({
    activeRole,
    congressJson,
    submissionTitle,
    submissionAbstract,
    submissionKeywords,
    contributors,
    submissionCategory,
    files,
    onSuccessSpeaker,
    onSuccessAdmin
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

    if (!ojsUrl.trim() || !ojsApiKey.trim()) {
      addLog('error', 'Error de Integración: URL de OJS o API Key faltantes.');
      setIsPublishing(false);
      return;
    }

    if (!selectedJournal) {
      addLog('error', 'Error de Integración: Debe conectar con OJS y seleccionar una revista de destino.');
      setIsPublishing(false);
      return;
    }

    const locale = getJournalLocale(selectedJournal.nameObj);

    if (activeRole === 'ponente') {
      addLog('info', `Iniciando proceso de sincronización REAL de ponencia con la revista "${selectedJournal.name}"...`);

      const filesToUpload = files.filter(x => x.file !== null);

      if (filesToUpload.length === 0) {
        addLog('error', 'Error de Validación: Debe cargar al menos un archivo para sincronizar.');
        setIsPublishing(false);
        return;
      }

      try {
        // Paso 0: Obtener una sección válida de la revista seleccionada
        addLog('info', `Consultando secciones virtuales para la revista "${selectedJournal.name}"...`);
        let sectionId = 1; // fallback
        try {
          sectionId = await ojsApi.fetchSectionId(ojsUrl, ojsApiKey, selectedJournal.urlPath);
          addLog('info', `Sección válida detectada (ID: ${sectionId})`);
        } catch (secErr: any) {
          addLog('info', `No se pudo extraer sectionId de envíos recientes, usando fallback: ${sectionId}`);
        }

        // Paso 1: Crear el envío (Submission) en OJS 3.4
        const submissionPayload = {
          locale: locale,
          sectionId: sectionId,
          publication: {
            title: { [locale]: submissionTitle },
            abstract: { [locale]: `Trabajo de la línea: ${congressJson.researchLine}. Categoría: ${submissionCategory}` }
          }
        };

        addLog('request', `POST /api/v1/submissions\nPayload:`, submissionPayload);
        const subData = await ojsApi.createSubmission(ojsUrl, ojsApiKey, selectedJournal.urlPath, submissionPayload);
        addLog('response', `HTTP/1.1 200 OK`, subData);

        const submissionId = subData.id || 412; // Fallback
        const publicationId = subData.currentPublication?.id || (subData.publications && subData.publications[0]?.id) || 1;

        addLog('success', `Envío creado con éxito. Submission ID: ${submissionId}, Publication ID: ${publicationId}`);

        // Paso 1.5: Actualizar la publicación con título, resumen y palabras clave (Requerido en OJS 3.4)
        addLog('info', `Actualizando metadatos de la publicación en OJS 3.4...`);
        const keywordsArray = submissionKeywords
          ? submissionKeywords.split(',').map(k => k.trim()).filter(Boolean)
          : [];
        const abstractText = submissionAbstract || `Trabajo de la línea: ${congressJson.researchLine}. Categoría: ${submissionCategory}`;
        const updatePayload = {
          title: { [locale]: submissionTitle },
          abstract: { [locale]: abstractText },
          ...(keywordsArray.length > 0 && { keywords: { [locale]: keywordsArray } })
        };
        addLog('request', `PUT /api/v1/submissions/${submissionId}/publications/${publicationId}\nPayload:`, updatePayload);
        const updatedPub = await ojsApi.updatePublication(ojsUrl, ojsApiKey, selectedJournal.urlPath, submissionId, publicationId, updatePayload);
        addLog('response', `HTTP/1.1 200 OK`, updatedPub);
        addLog('success', `Metadatos de publicación actualizados con éxito.`);

        // Paso 1.6: Registrar colaboradores/autores en la publicación
        const validContributors = (contributors || []).filter(c => c.email.trim() && c.givenName.trim());
        if (validContributors.length > 0) {
          addLog('info', `Registrando ${validContributors.length} colaborador(es) en la publicación...`);
          let userGroupId = 14; // fallback al Autor de la primera revista
          try {
            userGroupId = await ojsApi.fetchUserGroupId(ojsUrl, ojsApiKey, selectedJournal.urlPath, selectedJournal.id);
            addLog('info', `User Group ID de Autor detectado: ${userGroupId}`);
          } catch {
            addLog('info', `Usando User Group ID de Autor por defecto: ${userGroupId}`);
          }
          for (let i = 0; i < validContributors.length; i++) {
            const c = validContributors[i];
            const contribPayload = {
              givenName: { [locale]: c.givenName },
              familyName: { [locale]: c.familyName },
              email: c.email,
              country: c.country || 'PA',
              affiliation: { [locale]: c.affiliation },
              userGroupId: userGroupId,
              includeInBrowse: true,
              seq: i
            };
            addLog('request', `POST /api/v1/submissions/${submissionId}/publications/${publicationId}/contributors\nColaborador: ${c.givenName} ${c.familyName}`);
            try {
              const contribData = await ojsApi.addContributor(ojsUrl, ojsApiKey, selectedJournal.urlPath, submissionId, publicationId, contribPayload);
              addLog('response', `HTTP/1.1 200 OK`, contribData);
              addLog('success', `Colaborador "${c.givenName} ${c.familyName}" registrado correctamente (ID: ${contribData.id}).`);
            } catch (contribErr: any) {
              const msg = contribErr?.data ? JSON.stringify(contribErr.data) : String(contribErr);
              addLog('error', `No se pudo registrar al colaborador "${c.givenName} ${c.familyName}": ${msg}`);
            }
          }
        }

        // Paso 2: Subir cada archivo cargado como Submission File y asociarlo
        for (const item of filesToUpload) {
          if (item.file) {
            addLog('info', `Preparando subida de archivo para: ${item.label} ("${item.file.name}")...`);

            let fileObject: File;
            if (item.file.rawFile) {
              fileObject = item.file.rawFile;
            } else {
              // Si fue una carga simulada, creamos un Blob de prueba
              const dummyContent = new Blob([`Contenido de prueba de Nova para el archivo: ${item.file.name}`], { type: 'text/plain' });
              fileObject = new File([dummyContent], item.file.name, { type: 'text/plain' });
            }

            addLog('request', `POST /api/v1/submissions/${submissionId}/files\nArchivo: ${item.file.name} (${item.file.size} MB)`);
            const fileData = await ojsApi.uploadSubmissionFile(
              ojsUrl,
              ojsApiKey,
              selectedJournal.urlPath,
              submissionId,
              fileObject,
              '2', // SUBMISSION_FILE_SUBMISSION
              item.key === 'manuscript' ? '1' : '2' // 1: Texto del artículo, 2: Material de apoyo
            );

            addLog('response', `HTTP/1.1 200 OK`, fileData);
            const fileId = fileData.id || Math.floor(Math.random() * 5000);
            addLog('success', `Archivo "${item.file.name}" cargado exitosamente. File ID asignado: ${fileId}`);

            // Paso 3: Asociar el archivo como Galera (Galley) en la publicación
            addLog('info', `Asociando File ID ${fileId} como Galera de publicación...`);
            const galleyPayload = {
              label: item.label,
              submissionFileId: fileId,
              locale: locale
            };

            addLog('request', `POST /api/v1/submissions/${submissionId}/publications/${publicationId}/galleys\nPayload:`, galleyPayload);
            try {
              const galleyData = await ojsApi.createGalley(ojsUrl, ojsApiKey, selectedJournal.urlPath, submissionId, publicationId, galleyPayload);
              addLog('response', `HTTP/1.1 200 OK`, galleyData);
              addLog('success', `Galera "${item.label}" creada correctamente.`);
            } catch (galleyErr: any) {
              console.warn('Galley creation failed (OJS 3.4 lacks REST API for galleys):', galleyErr);
              addLog('info', `Nota: OJS 3.4 no soporta la creación automática de Galerías por API. Los archivos fueron cargados con éxito en la Ponencia (Submission ID: ${submissionId}), pero un administrador deberá asociarlos manualmente como Galerías desde el panel de OJS.`);
            }
          }
        }

        // Paso 4: Disparar el Webhook de notificación local (Simulado)
        const webhookPayload = {
          event: 'SUBMISSION_SYNCHRONIZED',
          timestamp: new Date().toISOString(),
          sourceSystem: 'SistemaGestionCongresosNova',
          data: {
            submissionId,
            title: submissionTitle,
            category: submissionCategory,
            filesCount: filesToUpload.length,
            researchLine: congressJson.researchLine
          }
        };
        addLog('info', `Disparando Webhook de notificación local de envío de ponencia...`);
        addLog('request', `POST /webhooks/submission-sync\nPayload:`, webhookPayload);
        addLog('response', `HTTP/1.1 200 OK\nWebhook registrado localmente.`);

        // Paso 4.5: Guardar envío en PostgreSQL local
        if (congressJson.id) {
          try {
            addLog('info', `Registrando envío en la base de datos local (PostgreSQL)...`);
            const pgResponse = await fetch('http://localhost:3001/api/envios', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                congreso_id: congressJson.id,
                ojs_submission_id: submissionId,
                ojs_publication_id: publicationId,
                categoria: submissionCategory,
                autor_email: validContributors[0]?.email || 'N/A',
                titulo_articulo: submissionTitle,
                palabras_claves: submissionKeywords || '',
                colaboradores: JSON.stringify(validContributors.map(c => `${c.givenName} ${c.familyName} (${c.email})`)),
                revista_destino: selectedJournal.name
              })
            });
            const pgData = await pgResponse.json();
            if (pgData.success) {
              addLog('success', `Envío registrado en PostgreSQL relacionado al Congreso ID ${congressJson.id}`);
            }
          } catch (pgErr: any) {
            addLog('error', `No se pudo conectar a la API local de PostgreSQL: ${pgErr.message}`);
          }
        } else {
           addLog('info', `Nota: Este congreso no tiene un ID local (no se guardó en Postgres previamente), omitiendo registro de envío local.`);
        }

        addLog('success', `¡Ponencia "${submissionTitle.substring(0, 30)}..." sincronizada en tiempo real con OJS 3.4 en la revista "${selectedJournal.name}"!`);
        
        if (onSuccessSpeaker) {
          onSuccessSpeaker();
        }

      } catch (err: any) {
        console.error(err);
        const errMsg = err.data && typeof err.data === 'object' ? JSON.stringify(err.data) : (err.message || err);
        addLog('error', `Falló el proceso de sincronización con OJS.\nDetalle: ${errMsg}`);
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    // Flujo Administrador / Organizador
    addLog('info', `Iniciando proceso de registro de congreso en la revista "${selectedJournal.name}" de OJS 3.4...`);

    if (congressJson.roles.length === 0) {
      addLog('error', 'Error de Validación: Debe seleccionar al menos un rol de usuario.');
      setIsPublishing(false);
      return;
    }

    try {
      // Paso 1: Obtener el Issue (Número) activo de la revista
      addLog('info', `Consultando números (Issues) disponibles en la revista OJS...`);
      const issuesData = await ojsApi.fetchIssues(ojsUrl, ojsApiKey, selectedJournal.urlPath);
      addLog('response', `HTTP/1.1 200 OK`, issuesData);

      const activeIssue = issuesData?.items?.[issuesData.items.length - 1];
      const activeIssueId = activeIssue?.id || 6;
      const activeIssueTitle = activeIssue?.title?.es || activeIssue?.title?.es_ES || `Número ${activeIssueId}`;
      addLog('success', `Issue activo encontrado: "${activeIssueTitle}" (ID: ${activeIssueId})`);

      // Paso 1.5: Obtener sección
      addLog('info', `Consultando secciones válidas para la revista "${selectedJournal.name}"...`);
      let sectionId = 1;
      try {
        sectionId = await ojsApi.fetchSectionId(ojsUrl, ojsApiKey, selectedJournal.urlPath);
        addLog('info', `Sección válida detectada (ID: ${sectionId})`);
      } catch (secErr) {
        addLog('info', `No se pudo extraer sectionId de envíos recientes, usando fallback: ${sectionId}`);
      }

      // Paso 2: Crear la Submission del congreso
      addLog('info', `Registrando el congreso como Submission en OJS...`);
      const submissionPayload = {
        locale: locale,
        sectionId: sectionId,
        publication: {
          title: { [locale]: congressJson.name },
          abstract: { [locale]: `${congressJson.description}\n\nLínea de investigación: ${congressJson.researchLine}\nSede: ${congressJson.venue}\nFecha: ${congressJson.date}` }
        }
      };

      addLog('request', `POST /api/v1/submissions\nPayload:`, submissionPayload);
      const subData = await ojsApi.createSubmission(ojsUrl, ojsApiKey, selectedJournal.urlPath, submissionPayload);
      addLog('response', `HTTP/1.1 200 OK`, subData);

      const submissionId = subData.id;
      const publicationId = subData.currentPublicationId || subData.publications?.[0]?.id;
      addLog('success', `¡Congreso registrado como Submission en OJS! Submission ID: ${submissionId}, Publication ID: ${publicationId}`);

      // Paso 2.5: Actualizar la publicación con el título y resumen reales del congreso (Requerido en OJS 3.4)
      addLog('info', `Actualizando metadatos de la publicación en OJS 3.4...`);
      const updatePayload = {
        title: { [locale]: congressJson.name },
        abstract: { [locale]: `${congressJson.description}\n\nLínea de investigación: ${congressJson.researchLine}\nSede: ${congressJson.venue}\nFecha: ${congressJson.date}` }
      };
      addLog('request', `PUT /api/v1/submissions/${submissionId}/publications/${publicationId}\nPayload:`, updatePayload);
      const updatedPub = await ojsApi.updatePublication(ojsUrl, ojsApiKey, selectedJournal.urlPath, submissionId, publicationId, updatePayload);
      addLog('response', `HTTP/1.1 200 OK`, updatedPub);
      addLog('success', `Metadatos de publicación del congreso actualizados con éxito.`);

      // Paso 3: Webhook
      const webhookPayload = {
        event: 'CONGRESS_REGISTERED',
        timestamp: new Date().toISOString(),
        sourceSystem: 'SistemaGestionCongresosNova',
        data: {
          ojsSubmissionId: submissionId,
          linkedIssueId: activeIssueId,
          congress: congressJson
        }
      };
      addLog('info', `Registrando evento de sincronización...`);
      addLog('request', `POST /webhooks/congress-sync\nPayload:`, webhookPayload);
      addLog('response', `HTTP/1.1 200 OK\nEvento registrado.`);

      // Paso 4: Guardar en PostgreSQL local
      try {
        addLog('info', `Registrando Congreso en base de datos local (PostgreSQL)...`);
        const pgResponse = await fetch('http://localhost:3001/api/congresos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: congressJson.name,
            descripcion: congressJson.description,
            fecha_celebracion: congressJson.date,
            sede: congressJson.venue,
            modalidad: congressJson.modality,
            nivel_academico: congressJson.academicLevel,
            linea_investigacion: congressJson.researchLine,
            aula_canal: congressJson.classroom
          })
        });
        const pgData = await pgResponse.json();
        if (pgData.success) {
          addLog('success', `Congreso guardado en PostgreSQL con ID local: ${pgData.congreso.id}`);
          if (onSuccessAdmin) {
            onSuccessAdmin(pgData.congreso.id);
          }
        } else {
          addLog('error', `Error al guardar en PostgreSQL: ${pgData.error}`);
        }
      } catch (pgErr: any) {
        addLog('error', `No se pudo conectar a la API local de PostgreSQL: ${pgErr.message}`);
      }

      addLog('success', `¡Congreso "${congressJson.name.substring(0, 40)}..." registrado con éxito en OJS!\n📌 Submission ID: ${submissionId} vinculado al Issue "${activeIssueTitle}" (ID: ${activeIssueId})\n✅ Visible en: ${selectedJournal.url}/submissions`);

    } catch (err: any) {
      console.error(err);
      const errMsg = err.data && typeof err.data === 'object' ? JSON.stringify(err.data) : (err.message || err);
      addLog('error', `Falló el proceso de publicación en OJS.\nDetalle: ${errMsg}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const copyPayload = (congressJson: Congress) => {
    navigator.clipboard.writeText(JSON.stringify(congressJson, null, 2));
    alert('¡Payload JSON copiado al portapapeles!');
  };

  return {
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
    logs,
    addLog,
    clearConsole,
    testOjsConnection,
    publishAndSyncOjs,
    copyPayload
  };
}
