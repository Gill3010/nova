const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service');
const { JWT_SECRET } = require('../config');
const logger = require('../utils/logger');
const { verifyTurnstileToken } = require('../services/turnstile.service');

class AuthController {
  async registerPublic(req, res) {
    try {
      const { nombre, email, password, rol } = req.body;
      logger.info('Recibida petición de registro de usuario público', { email, nombre, rol });

      const user = await authService.createUser({ nombre, email, password, rol });
      logger.info('Usuario registrado con éxito', { userId: user.id, email });
      res.status(201).json({ success: true, userId: user.id });
    } catch (error) {
      if (error.code === 'UNIQUE_CONSTRAINT') {
        logger.warn('Registro fallido: correo duplicado', { email: req.body.email });
        return res.status(400).json({ error: error.message });
      }
      logger.error('Error interno al registrar usuario', { error: error.message });
      res.status(500).json({ error: 'Error interno al registrar usuario' });
    }
  }

  async registerAdmin(req, res) {
    try {
      const { nombre, email, password } = req.body;
      const adminEmail = req.user.email; // Who is creating the admin
      logger.info('Petición de registro de nuevo ADMIN', { email, nombre, createdBy: adminEmail });

      const user = await authService.createUser({ nombre, email, password, rol: 'admin' });
      logger.info('Administrador registrado con éxito', { userId: user.id, email, createdBy: adminEmail });
      res.status(201).json({ success: true, userId: user.id });
    } catch (error) {
      if (error.code === 'UNIQUE_CONSTRAINT') {
        return res.status(400).json({ error: error.message });
      }
      logger.error('Error interno al registrar administrador', { error: error.message });
      res.status(500).json({ error: 'Error interno al registrar administrador' });
    }
  }

  async login(req, res) {
    try {
      const { email, password, 'cf-turnstile-response': turnstileToken } = req.body;
      const clientIp = req.ip;
      
      const isTurnstileValid = await verifyTurnstileToken(turnstileToken, clientIp);
      if (!isTurnstileValid) {
        logger.warn('Login fallido: Validación de Turnstile incorrecta o ausente', { email });
        return res.status(400).json({ error: 'La verificación de seguridad (Turnstile) ha fallado o ha expirado. Por favor, inténtalo de nuevo.' });
      }

      const user = await authService.findByEmail(email);
      
      if (!user) {
        logger.warn('Login fallido: usuario no registrado', { email });
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      if (user.is_active === false) {
        logger.warn('Login fallido: usuario inactivo', { email });
        return res.status(403).json({ error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
      }

      const match = await authService.verifyPassword(password, user.password_hash);
      if (!match) {
        logger.warn('Login fallido: contraseña incorrecta', { email });
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const payload = { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

      logger.info('Sesión iniciada con éxito', { userId: user.id, email: user.email, rol: user.rol });
      res.json({ success: true, token, user: payload });
    } catch (error) {
      logger.error('Error en el login', { error: error.message });
      res.status(500).json({ error: 'Error interno al procesar el inicio de sesión' });
    }
  }
}

module.exports = new AuthController();
