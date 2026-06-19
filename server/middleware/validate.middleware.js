const { z } = require('zod');
const logger = require('../utils/logger');

const validate = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zErrors = error.issues || error.errors || [];
        const errors = zErrors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        logger.warn('Error de validación de esquema', { errors, ip: req.ip });
        return res.status(400).json({ error: 'Errores de validación', details: errors });
      }
      next(error);
    }
  };
};

module.exports = { validate };
