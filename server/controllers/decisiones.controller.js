const decisionesService = require('../services/decisiones.service');

class DecisionesController {
  /**
   * POST /api/decisiones-editoriales
   * Registra la decisión editorial para un envío.
   * Body: { envio_id, decision, justificacion }
   */
  async submitDecision(req, res) {
    try {
      const editorId = req.user.id;
      const { envio_id, decision, justificacion } = req.body;

      const result = await decisionesService.submitDecision(
        editorId,
        envio_id,
        decision,
        justificacion
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/decisiones-editoriales/pendientes
   * Devuelve envíos pendientes de decisión editorial.
   */
  async getPendientes(req, res) {
    try {
      const envios = await decisionesService.getEnviosPendientes();
      res.status(200).json({ success: true, data: envios });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/decisiones-editoriales/dashboard
   * Dashboard completo del editor con todos los envíos y sus métricas.
   */
  async getDashboard(req, res) {
    try {
      const envios = await decisionesService.getEditorDashboard();
      res.status(200).json({ success: true, data: envios });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/decisiones-editoriales/:envioId/historial
   * Historial de decisiones de un envío.
   */
  async getHistorial(req, res) {
    try {
      const envioId = parseInt(req.params.envioId, 10);
      if (isNaN(envioId)) {
        return res.status(400).json({ success: false, error: 'ID de envío inválido' });
      }

      const historial = await decisionesService.getDecisionHistory(envioId);
      res.status(200).json({ success: true, data: historial });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/decisiones-editoriales/:envioId/evaluaciones
   * Evaluaciones detalladas de los revisores para un envío.
   */
  async getEvaluaciones(req, res) {
    try {
      const envioId = parseInt(req.params.envioId, 10);
      if (isNaN(envioId)) {
        return res.status(400).json({ success: false, error: 'ID de envío inválido' });
      }

      const evaluaciones = await decisionesService.getEvaluacionesEnvio(envioId);
      res.status(200).json({ success: true, data: evaluaciones });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new DecisionesController();
