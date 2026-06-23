const decisionesRepository = require('../repositories/decisiones.repository');
const logger = require('../utils/logger');

const VALID_DECISIONS = ['accepted', 'rejected', 'revision_required'];

class DecisionesService {
  /**
   * Registra una decisión editorial para un envío.
   * Valida inputs, verifica existencia del envío, persiste y actualiza estado.
   */
  async submitDecision(editorId, envioId, decision, justificacion) {
    // Validación de inputs
    if (!envioId) {
      const err = new Error('El ID del envío es requerido');
      err.statusCode = 400;
      throw err;
    }

    if (!decision || !VALID_DECISIONS.includes(decision)) {
      const err = new Error(`Decisión inválida. Valores permitidos: ${VALID_DECISIONS.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    if (!justificacion || !justificacion.trim()) {
      const err = new Error('La justificación es obligatoria');
      err.statusCode = 400;
      throw err;
    }

    // Verificar que el envío existe
    const exists = await decisionesRepository.envioExists(envioId);
    if (!exists) {
      const err = new Error('El envío especificado no existe');
      err.statusCode = 404;
      throw err;
    }

    try {
      const result = await decisionesRepository.create({
        envioId,
        editorId,
        decision,
        justificacion: justificacion.trim(),
      });

      logger.info('Decisión editorial registrada', {
        editorId,
        envioId,
        decision,
        decisionId: result.id,
      });

      return result;
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('Error al registrar decisión editorial', {
        error: error.message,
        editorId,
        envioId,
      });
      throw new Error('Error interno al registrar la decisión editorial');
    }
  }

  /**
   * Obtiene envíos pendientes de decisión editorial.
   */
  async getEnviosPendientes() {
    try {
      return await decisionesRepository.findPendingEnvios();
    } catch (error) {
      logger.error('Error al obtener envíos pendientes', { error: error.message });
      throw new Error('Error interno al obtener envíos pendientes');
    }
  }

  /**
   * Obtiene el historial de decisiones de un envío.
   */
  async getDecisionHistory(envioId) {
    try {
      return await decisionesRepository.findByEnvioId(envioId);
    } catch (error) {
      logger.error('Error al obtener historial de decisiones', {
        error: error.message,
        envioId,
      });
      throw new Error('Error interno al obtener historial de decisiones');
    }
  }

  /**
   * Dashboard del editor: todos los envíos con su estado editorial y métricas.
   */
  async getEditorDashboard() {
    try {
      return await decisionesRepository.findAllWithStatus();
    } catch (error) {
      logger.error('Error al obtener dashboard del editor', { error: error.message });
      throw new Error('Error interno al obtener el dashboard del editor');
    }
  }

  /**
   * Obtiene las evaluaciones detalladas de los revisores para un envío.
   */
  async getEvaluacionesEnvio(envioId) {
    try {
      return await decisionesRepository.findEvaluacionesByEnvioId(envioId);
    } catch (error) {
      logger.error('Error al obtener evaluaciones del envío', {
        error: error.message,
        envioId,
      });
      throw new Error('Error interno al obtener las evaluaciones');
    }
  }
}

module.exports = new DecisionesService();
