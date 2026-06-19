const logger = require('../utils/logger');

/**
 * Valida un token de Cloudflare Turnstile contra la API de verificación.
 * 
 * @param {string} token El token recibido del frontend (cf-turnstile-response)
 * @param {string} [ip] La IP del cliente opcional para mayor seguridad
 * @returns {Promise<boolean>} Retorna true si el token es válido, false en caso contrario
 */
async function verifyTurnstileToken(token, ip) {
  if (process.env.NODE_ENV === 'development' || process.env.SKIP_TURNSTILE === 'true') {
    logger.info('Desarrollo local: Omitiendo verificación de Turnstile');
    return true;
  }

  const rawSecretKey = process.env.TURNSTILE_SECRET_KEY;
  const secretKey = rawSecretKey ? rawSecretKey.trim() : null;

  if (!secretKey) {
    logger.error('Error de configuración: TURNSTILE_SECRET_KEY no está definida en las variables de entorno.');
    return false;
  }

  if (!token) {
    logger.warn('Validación de Turnstile fallida: No se recibió token.');
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      logger.error('La API de Cloudflare Turnstile retornó un código de estado no exitoso', {
        status: response.status
      });
      return false;
    }

    const data = await response.json();

    if (data.success) {
      logger.info('Verificación de Turnstile exitosa');
      return true;
    } else {
      logger.warn('Token de Turnstile inválido o rechazado por Cloudflare', {
        errorCodes: data['error-codes']
      });
      return false;
    }
  } catch (error) {
    logger.error('Error de red/conexión al validar token de Turnstile con Cloudflare', {
      error: error.message
    });
    return false;
  }
}

module.exports = {
  verifyTurnstileToken
};
