const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../config');
const logger = require('../utils/logger');

// Regex para validación de formato de email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 1. Registro de usuarios con validación de inputs
router.post('/register', async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  logger.info('Recibida petición de registro de usuario', { email, nombre, rol });

  // Validaciones de presencia
  if (!nombre || !email || !password || !rol) {
    logger.warn('Registro fallido: campos incompletos', { email });
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // Validación de formato de email
  if (!EMAIL_REGEX.test(email)) {
    logger.warn('Registro fallido: formato de correo inválido', { email });
    return res.status(400).json({ error: 'El correo electrónico no tiene un formato válido' });
  }

  // Validación de longitud de contraseña
  if (password.length < 6) {
    logger.warn('Registro fallido: contraseña muy corta', { email });
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  // Validación de roles permitidos
  const rolesPermitidos = ['speaker', 'organizer', 'admin', 'attendee'];
  if (!rolesPermitidos.includes(rol)) {
    logger.warn('Registro fallido: rol no permitido', { email, rol });
    return res.status(400).json({ error: 'El rol especificado no es válido' });
  }

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const query = `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4)`;
    db.run(query, [nombre.trim(), email.trim().toLowerCase(), passwordHash, rol], function (err) {
      if (err) {
        logger.error('Error insertando usuario en SQLite', { email, error: err.message });
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }
        return res.status(500).json({ error: 'Error interno al registrar usuario' });
      }
      logger.info('Usuario registrado con éxito', { userId: this.lastID, email });
      res.status(201).json({ success: true, userId: this.lastID });
    });
  } catch (error) {
    logger.error('Error al procesar encriptación en registro', { email, error: error.message });
    res.status(500).json({ error: 'Error al procesar el registro' });
  }
});

// 2. Login de usuarios con validación de inputs
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('Login fallido: campos vacíos');
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const query = `SELECT * FROM usuarios WHERE email = $1`;
  
  db.get(query, [normalizedEmail], async (err, user) => {
    if (err) {
      logger.error('Error al consultar usuario para login', { email: normalizedEmail, error: err.message });
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    if (!user) {
      logger.warn('Login fallido: usuario no registrado', { email: normalizedEmail });
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (user.is_active === false) {
      logger.warn('Login fallido: usuario inactivo', { email: normalizedEmail });
      return res.status(403).json({ error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
    }

    try {
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        logger.warn('Login fallido: contraseña incorrecta', { email: normalizedEmail });
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const payload = { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

      logger.info('Sesión iniciada con éxito', { userId: user.id, email: normalizedEmail, rol: user.rol });
      res.json({ success: true, token, user: payload });
    } catch (error) {
      logger.error('Error en comparación de bcrypt durante login', { email: normalizedEmail, error: error.message });
      res.status(500).json({ error: 'Error interno al procesar el inicio de sesión' });
    }
  });
});

module.exports = router;
