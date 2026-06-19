/**
 * apiKey.middleware.js
 *
 * Middleware para autenticar peticiones internas provenientes de AWS Lambda.
 * La Lambda debe enviar el header: `x-nova-api-key: <NOVA_INTERNAL_API_KEY>`
 * Este valor debe configurarse en las variables de entorno del servidor y de la Lambda.
 */
const logger = require('../utils/logger');

const apiKeyAuth = (req, res, next) => {
  const internalApiKey = process.env.NOVA_INTERNAL_API_KEY;

  if (!internalApiKey) {
    logger.error('NOVA_INTERNAL_API_KEY no está configurada en el servidor');
    return res.status(500).json({ success: false, error: 'Configuración del servidor incompleta' });
  }

  const providedKey = req.headers['x-nova-api-key'];

  if (!providedKey || providedKey !== internalApiKey) {
    logger.warn('Intento de acceso con API Key inválida o ausente', {
      ip: req.ip,
      path: req.originalUrl,
    });
    return res.status(401).json({ success: false, error: 'API Key inválida o no proporcionada' });
  }

  next();
};

module.exports = { apiKeyAuth };
