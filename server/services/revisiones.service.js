const revisionesRepository = require('../repositories/revisiones.repository');
const logger = require('../utils/logger');
const db = require('../db');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

class RevisionesService {
  /**
   * Recibe los resultados del agente IA (Lambda) y los persiste en BD.
   * Protegido con una API Key interna compartida con AWS Lambda.
   */
  async saveSystemReport({ envioId, scoreScientific, scoreOriginality, scorePresentation, comments }) {
    if (!envioId) {
      const err = new Error('envio_id es requerido');
      err.statusCode = 400;
      throw err;
    }

    const scores = [scoreScientific, scoreOriginality, scorePresentation];
    for (const score of scores) {
      if (score !== undefined && (typeof score !== 'number' || score < 0 || score > 10)) {
        const err = new Error('Las puntuaciones deben ser números entre 0 y 10');
        err.statusCode = 400;
        throw err;
      }
    }

    // Resolver el ID local en la base de datos a partir del ojs_submission_id
    let actualEnvioId = envioId;
    try {
      const { rows } = await db.query(
        'SELECT id FROM envios_ojs WHERE ojs_submission_id = $1 OR id = $1 LIMIT 1',
        [envioId]
      );
      if (rows.length > 0) {
        actualEnvioId = rows[0].id;
      }
    } catch (dbErr) {
      logger.error('Error al resolver ojs_submission_id en saveSystemReport', { error: dbErr.message, envioId });
    }

    try {
      const report = await revisionesRepository.upsertSystemReport({
        envioId: actualEnvioId,
        scoreScientific: scoreScientific ?? null,
        scoreOriginality: scoreOriginality ?? null,
        scorePresentation: scorePresentation ?? null,
        comments: comments ?? null,
      });
      logger.info('Reporte del sistema guardado', { envioId, reportId: report.id });
      return report;
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('Error al guardar reporte del sistema', { error: error.message, envioId });
      throw new Error('Error interno al guardar el reporte del sistema');
    }
  }

  /**
   * Obtiene el reporte del sistema para un envío.
   */
  async getSystemReport(envioId) {
    try {
      return await revisionesRepository.findByEnvioId(envioId);
    } catch (error) {
      logger.error('Error al obtener reporte del sistema', { error: error.message, envioId });
      throw new Error('Error interno al obtener el reporte del sistema');
    }
  }

  /**
   * Dispara asíncronamente el agente IA (Lambda) para procesar un manuscrito en OJS.
   */
  async triggerAiReview(envioId) {
    try {
      // 1. Obtener la metadata necesaria (URL, path, credentials) desde la BD
      const query = `
        SELECT 
          e.ojs_submission_id,
          r.ojs_journal_path,
          p.ojs_url,
          p.ojs_api_key
        FROM envios_ojs e
        JOIN revistas_ojs r ON e.revista_ojs_id = r.id
        JOIN portales_ojs p ON r.portal_ojs_id = p.id
        WHERE e.id = $1
        LIMIT 1;
      `;
      const { rows } = await db.query(query, [envioId]);

      if (rows.length === 0) {
        throw new Error('No se encontró información del envío o del portal OJS asociado.');
      }

      const { ojs_submission_id, ojs_journal_path, ojs_url, ojs_api_key } = rows[0];

      if (!ojs_submission_id || !ojs_journal_path || !ojs_url || !ojs_api_key) {
        throw new Error('Información incompleta del portal OJS. Faltan credenciales o paths.');
      }

      // 2. Preparar el payload para la Lambda
      const payload = {
        ojs_submission_id: ojs_submission_id.toString(),
        ojs_base_url: ojs_url,
        ojs_api_key: ojs_api_key,
        ojs_journal_path: ojs_journal_path
      };

      logger.info('Invocando orquestador de revisión por IA...', { envioId, ojs_submission_id, ojs_journal_path });

      // 3. Invocar Lambda asíncronamente (Event)
      const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
      const command = new InvokeCommand({
        FunctionName: 'nova-review-orchestrator',
        InvocationType: 'Event', // Ejecución asíncrona, no esperamos la respuesta aquí
        Payload: Buffer.from(JSON.stringify(payload))
      });

      await lambda.send(command);
      logger.info('Orden de revisión enviada exitosamente a la IA', { envioId });

      return { success: true, message: 'Orden de revisión enviada a la IA' };
    } catch (error) {
      logger.error('Error al disparar revisión de IA', { error: error.message, envioId });
      throw new Error(`No se pudo invocar a la IA: ${error.message}`);
    }
  }
}

module.exports = new RevisionesService();
