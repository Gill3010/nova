const enviosRepository = require('../repositories/envios.repository');
const logger = require('../utils/logger');

// Regex para validación de formato de email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class EnviosService {
  async getUserEnvios(userId) {
    try {
      return await enviosRepository.findByUserId(userId);
    } catch (error) {
      logger.error('Error al obtener los envíos del usuario en BD', { error: error.message, userId });
      throw new Error('Error interno del servidor al obtener envíos');
    }
  }

  async createEnvio(envioData, userId) {
    // Validación de inputs obligatorios
    if (!envioData.congreso_id) {
      logger.warn('Registro de envío OJS fallido: falta congreso_id', { userId });
      const error = new Error('El ID del congreso es requerido');
      error.statusCode = 400;
      throw error;
    }
    if (!envioData.ojs_submission_id) {
      logger.warn('Registro de envío OJS fallido: falta ojs_submission_id', { userId });
      const error = new Error('El ID de envío de OJS es requerido');
      error.statusCode = 400;
      throw error;
    }
    if (!envioData.titulo_articulo || !envioData.titulo_articulo.trim()) {
      logger.warn('Registro de envío OJS fallido: titulo_articulo vacío', { userId });
      const error = new Error('El título del artículo es requerido');
      error.statusCode = 400;
      throw error;
    }
    if (!envioData.nivel_academico || !envioData.nivel_academico.trim()) {
      logger.warn('Registro de envío OJS fallido: falta nivel_academico', { userId });
      const error = new Error('El nivel académico es requerido');
      error.statusCode = 400;
      throw error;
    }
    if (!envioData.linea_investigacion || !envioData.linea_investigacion.trim()) {
      logger.warn('Registro de envío OJS fallido: falta linea_investigacion', { userId });
      const error = new Error('La línea de investigación es requerida');
      error.statusCode = 400;
      throw error;
    }

    // Validación de email
    if (envioData.autor_email && !EMAIL_REGEX.test(envioData.autor_email)) {
      logger.warn('Registro de envío OJS fallido: formato email del autor inválido', { userId, autor_email: envioData.autor_email });
      const error = new Error('El correo electrónico del autor no tiene un formato válido');
      error.statusCode = 400;
      throw error;
    }

    try {
      const dataToSave = { ...envioData, usuario_id: userId };
      const newEnvio = await enviosRepository.create(dataToSave);
      logger.info('Envío de OJS registrado con éxito', { insertedId: newEnvio.id, ojs_submission_id: envioData.ojs_submission_id, userId });
      return newEnvio;
    } catch (error) {
      logger.error('Error insertando envío OJS en BD', { error: error.message, userId });
      throw new Error('Error interno del servidor al registrar el envío');
    }
  }

  async updateEnvio(envioId, userId, rol, updates) {
    // Validación de inputs obligatorios
    if (updates.titulo_articulo !== undefined && (!updates.titulo_articulo || !updates.titulo_articulo.trim())) {
      logger.warn('Actualización de envío OJS fallida: titulo_articulo vacío', { envioId, userId });
      const error = new Error('El título del artículo es requerido');
      error.statusCode = 400;
      throw error;
    }
    if (updates.nivel_academico !== undefined && (!updates.nivel_academico || !updates.nivel_academico.trim())) {
      logger.warn('Actualización de envío OJS fallida: nivel_academico vacío', { envioId, userId });
      const error = new Error('El nivel académico es requerido');
      error.statusCode = 400;
      throw error;
    }
    if (updates.linea_investigacion !== undefined && (!updates.linea_investigacion || !updates.linea_investigacion.trim())) {
      logger.warn('Actualización de envío OJS fallida: linea_investigacion vacía', { envioId, userId });
      const error = new Error('La línea de investigación es requerida');
      error.statusCode = 400;
      throw error;
    }

    try {
      // Limpiar datos
      const cleanedUpdates = { ...updates };
      if (cleanedUpdates.titulo_articulo) cleanedUpdates.titulo_articulo = cleanedUpdates.titulo_articulo.trim();
      if (cleanedUpdates.palabras_claves) cleanedUpdates.palabras_claves = cleanedUpdates.palabras_claves.trim();
      if (cleanedUpdates.resumen) cleanedUpdates.resumen = cleanedUpdates.resumen.trim();
      if (cleanedUpdates.nivel_academico) cleanedUpdates.nivel_academico = cleanedUpdates.nivel_academico.trim();
      if (cleanedUpdates.linea_investigacion) cleanedUpdates.linea_investigacion = cleanedUpdates.linea_investigacion.trim();

      const result = await enviosRepository.update(envioId, userId, rol, cleanedUpdates);
      
      if (result.changes === 0) {
        logger.warn('Intento de actualización fallido: envío no encontrado o no autorizado', { envioId, userId });
        const error = new Error('Envío no encontrado o no autorizado');
        error.statusCode = 404;
        throw error;
      }

      logger.info('Envío de OJS actualizado con éxito', { envioId, userId });
      return { success: true, message: 'Envío actualizado exitosamente' };
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw custom errors
      logger.error('Error actualizando envío OJS en BD', { error: error.message, envioId, userId });
      throw new Error('Error interno del servidor al actualizar el envío');
    }
  }
}

module.exports = new EnviosService();
