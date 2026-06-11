const enviosService = require('../services/envios.service');

class EnviosController {
  async getEnvios(req, res) {
    try {
      const userId = req.user.id;
      const envios = await enviosService.getUserEnvios(userId);
      res.status(200).json({ success: true, data: envios });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async createEnvio(req, res) {
    try {
      const userId = req.user.id;
      const envioData = req.body;
      const result = await enviosService.createEnvio(envioData, userId);
      res.status(201).json({ success: true, envio: result });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  async updateEnvio(req, res) {
    try {
      const envioId = req.params.id;
      const userId = req.user.id;
      const rol = req.user.rol;
      const updates = req.body;
      
      const result = await enviosService.updateEnvio(envioId, userId, rol, updates);
      res.status(200).json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new EnviosController();
