const enviosService = require('../services/envios.service');
const storageService = require('../services/storage.service');
const db = require('../db');
const logger = require('../utils/logger');

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

      // Si se subió un archivo, guardarlo en S3 o local
      if (req.file) {
        const ext = req.file.originalname.split('.').pop();
        const fileKey = `envio-u${userId}-${Date.now()}.${ext}`;
        await storageService.saveFile(req.file.buffer, fileKey, req.file.mimetype);
        envioData.archivo_key = fileKey;
        logger.info('Archivo del envío guardado en almacenamiento', { fileKey, userId });
      }

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

  /**
   * GET /api/envios/archivo/:id
   * Sirve el archivo del envío en streaming.
   * Solo accesible por revisores asignados o admins.
   */
  async streamArchivoEnvio(req, res) {
    try {
      const envioId = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const rol = req.user.rol;

      if (isNaN(envioId)) {
        return res.status(400).json({ success: false, error: 'ID de envío inválido' });
      }

      // Verificar que el envío existe y obtener su archivo_key
      const { rows } = await db.query(
        'SELECT archivo_key FROM envios_ojs WHERE id = $1',
        [envioId]
      );
      const envio = rows[0];

      if (!envio || !envio.archivo_key) {
        return res.status(404).json({ success: false, error: 'No hay archivo disponible para este envío' });
      }

      // Verificar autorización: admin, editor, organizador o revisor asignado
      if (rol !== 'admin' && rol !== 'editor' && rol !== 'organizer') {
        const { rows: assignRows } = await db.query(
          'SELECT 1 FROM revisores_envios WHERE revisor_id = $1 AND envio_id = $2',
          [userId, envioId]
        );
        if (assignRows.length === 0) {
          return res.status(403).json({ success: false, error: 'No tienes acceso a este archivo' });
        }
      }

      const buffer = await storageService.readFile(envio.archivo_key);
      const ext = envio.archivo_key.split('.').pop().toLowerCase();
      const mimeTypes = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', doc: 'application/msword' };
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);

      logger.info('Archivo del envío servido al revisor', { envioId, userId, fileKey: envio.archivo_key });
    } catch (error) {
      logger.error('Error al servir archivo del envío', { error: error.message });
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new EnviosController();
