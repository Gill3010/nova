const revisionesRepository = require('../repositories/revisiones.repository');
const logger = require('../utils/logger');

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

    try {
      const report = await revisionesRepository.upsertSystemReport({
        envioId,
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
}

module.exports = new RevisionesService();
