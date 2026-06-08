const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware para verificar que el usuario es admin
const checkAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    logger.warn('Intento de acceso no autorizado a gestión de usuarios', { userId: req.user.id });
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};

// 1. Obtener todos los usuarios
router.get('/', verifyToken, checkAdmin, (req, res) => {
  const query = `
    SELECT id, nombre, email, rol, is_active, created_at 
    FROM usuarios 
    ORDER BY created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      logger.error('Error al obtener lista de usuarios', { error: err.message });
      return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
    res.status(200).json({ success: true, data: rows });
  });
});

// 2. Actualizar el rol de un usuario
router.put('/:id/rol', verifyToken, checkAdmin, (req, res) => {
  const targetUserId = req.params.id;
  const { rol } = req.body;
  const rolesPermitidos = ['attendee', 'speaker', 'organizer', 'admin'];

  if (!rolesPermitidos.includes(rol)) {
    return res.status(400).json({ success: false, error: 'Rol no válido: ' + rol });
  }

  // Prevenir que un admin se quite a sí mismo el rol de admin por error
  if (targetUserId == req.user.id && rol !== 'admin') {
    return res.status(400).json({ success: false, error: 'No puedes quitarte tu propio rol de administrador.' });
  }

  const query = `UPDATE usuarios SET rol = $1 WHERE id = $2`;
  
  db.run(query, [rol, targetUserId], function(err) {
    if (err) {
      logger.error('Error al actualizar rol de usuario', { error: err.message, targetUserId });
      return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    logger.info('Rol de usuario actualizado', { adminId: req.user.id, targetUserId, newRole: rol });
    res.json({ success: true, message: 'Rol actualizado exitosamente' });
  });
});

// 3. Activar / Desactivar usuario (eliminación lógica)
router.put('/:id/status', verifyToken, checkAdmin, (req, res) => {
  const targetUserId = req.params.id;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ success: false, error: 'El estado is_active debe ser booleano' });
  }

  // Prevenir que el admin se desactive a sí mismo
  if (targetUserId == req.user.id && is_active === false) {
    return res.status(400).json({ success: false, error: 'No puedes desactivar tu propio usuario.' });
  }

  const query = `UPDATE usuarios SET is_active = $1 WHERE id = $2`;
  
  db.run(query, [is_active, targetUserId], function(err) {
    if (err) {
      logger.error('Error al actualizar estado de usuario', { error: err.message, targetUserId });
      return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    logger.info('Estado de usuario actualizado', { adminId: req.user.id, targetUserId, is_active });
    res.json({ success: true, message: `Usuario ${is_active ? 'activado' : 'desactivado'} exitosamente` });
  });
});

module.exports = router;
