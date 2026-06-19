const revisionesService = require('../services/revisiones.service');
const logger = require('../utils/logger');

class RevisionesController {
  /**
   * POST /api/revisiones/sistema
   * Recibe el reporte de la Lambda de IA y lo persiste.
   * Autenticado con una API Key interna (middleware apiKeyAuth).
   */
  async saveSystemReport(req, res) {
    try {
      const { envio_id, score_scientific, score_originality, score_presentation, comments } = req.body;
      const report = await revisionesService.saveSystemReport({
        envioId: envio_id,
        scoreScientific: score_scientific,
        scoreOriginality: score_originality,
        scorePresentation: score_presentation,
        comments,
      });
      res.status(201).json({ success: true, data: report });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/revisiones/sistema/:envioId
   * Devuelve el reporte del sistema para un envío (para el panel del revisor).
   * Autenticado con JWT del usuario (revisor/admin).
   */
  async getSystemReport(req, res) {
    try {
      const envioId = parseInt(req.params.envioId, 10);
      if (isNaN(envioId)) {
        return res.status(400).json({ success: false, error: 'ID de envío inválido' });
      }
      const report = await revisionesService.getSystemReport(envioId);
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new RevisionesController();
