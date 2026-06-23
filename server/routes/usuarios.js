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

// Middleware para verificar que el usuario es admin o editor
const checkAdminOrEditor = (req, res, next) => {
  if (req.user.rol !== 'admin' && req.user.rol !== 'editor') {
    logger.warn('Intento de acceso no autorizado a gestión de revisores', { userId: req.user.id });
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador o editor.' });
  }
  next();
};

// 1. Obtener todos los usuarios
router.get('/', verifyToken, checkAdmin, async (req, res) => {
  try {
    const query = `
      SELECT id, nombre, email, rol, is_active, created_at 
      FROM usuarios 
      ORDER BY created_at DESC
    `;
    
    const { rows } = await db.query(query);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    logger.error('Error al obtener lista de usuarios', { error: err.message });
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// 2. Actualizar el rol de un usuario
router.put('/:id/rol', verifyToken, checkAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { rol } = req.body;
    const rolesPermitidos = ['attendee', 'speaker', 'organizer', 'admin', 'reviewer', 'editor'];

    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({ success: false, error: 'Rol no válido: ' + rol });
    }

    // Prevenir que un admin se quite a sí mismo el rol de admin por error
    if (targetUserId == req.user.id && rol !== 'admin') {
      return res.status(400).json({ success: false, error: 'No puedes quitarte tu propio rol de administrador.' });
    }

    const query = `UPDATE usuarios SET rol = $1 WHERE id = $2`;
    
    const { rowCount } = await db.query(query, [rol, targetUserId]);
    
    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    logger.info('Rol de usuario actualizado', { adminId: req.user.id, targetUserId, newRole: rol });
    res.json({ success: true, message: 'Rol actualizado exitosamente' });
  } catch (err) {
    logger.error('Error al actualizar rol de usuario', { error: err.message, targetUserId: req.params.id });
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// 3. Activar / Desactivar usuario (eliminación lógica)
router.put('/:id/status', verifyToken, checkAdmin, async (req, res) => {
  try {
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
    
    const { rowCount } = await db.query(query, [is_active, targetUserId]);
    
    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    logger.info('Estado de usuario actualizado', { adminId: req.user.id, targetUserId, is_active });
    res.json({ success: true, message: `Usuario ${is_active ? 'activado' : 'desactivado'} exitosamente` });
  } catch (err) {
    logger.error('Error al actualizar estado de usuario', { error: err.message, targetUserId: req.params.id });
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// 4. Obtener envíos asignados al revisor autenticado
router.get('/revisores/envios', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        e.id, e.ojs_submission_id, e.ojs_publication_id, e.titulo_articulo,
        e.resumen, e.palabras_claves, e.colaboradores, e.categoria,
        e.nivel_academico, e.linea_investigacion, e.created_at, e.congreso_id,
        r.ojs_journal_path AS revista_path, p.ojs_url AS portal_url,
        p.ojs_api_key AS portal_api_key
      FROM revisores_envios re
      JOIN envios_ojs e ON re.envio_id = e.id
      JOIN congresos c ON e.congreso_id = c.id
      LEFT JOIN revistas_ojs r ON e.revista_ojs_id = r.id
      LEFT JOIN portales_ojs p ON r.portal_ojs_id = p.id
      WHERE re.revisor_id = $1
      ORDER BY e.created_at DESC
    `;
    const { rows } = await db.query(query, [req.user.id]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    logger.error('Error al obtener envíos asignados al revisor', { error: err.message, userId: req.user.id });
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// 5. Asignar un envío a un revisor (Admin)
router.post('/revisores/asignar', verifyToken, checkAdminOrEditor, async (req, res) => {
  try {
    const { revisorId, envioId } = req.body;
    if (!revisorId || !envioId) {
      return res.status(400).json({ success: false, error: 'Faltan revisorId o envioId' });
    }
    
    // Verificar que el usuario asignado es realmente un revisor
    const checkUser = await db.query('SELECT rol FROM usuarios WHERE id = $1', [revisorId]);
    if (checkUser.rows.length === 0 || checkUser.rows[0].rol !== 'reviewer') {
      return res.status(400).json({ success: false, error: 'El usuario especificado no existe o no tiene el rol de revisor' });
    }

    const query = `
      INSERT INTO revisores_envios (revisor_id, envio_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `;
    await db.query(query, [revisorId, envioId]);
    logger.info('Envío asignado a revisor', { adminId: req.user.id, revisorId, envioId });
    res.json({ success: true, message: 'Envío asignado exitosamente' });
  } catch (err) {
    logger.error('Error al asignar envío a revisor', { error: err.message });
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// 6. Desasignar un envío a un revisor (Admin)
router.post('/revisores/desasignar', verifyToken, checkAdminOrEditor, async (req, res) => {
  try {
    const { revisorId, envioId } = req.body;
    if (!revisorId || !envioId) {
      return res.status(400).json({ success: false, error: 'Faltan revisorId o envioId' });
    }

    const query = `
      DELETE FROM revisores_envios
      WHERE revisor_id = $1 AND envio_id = $2
    `;
    await db.query(query, [revisorId, envioId]);
    logger.info('Envío desasignado de revisor', { adminId: req.user.id, revisorId, envioId });
    res.json({ success: true, message: 'Envío desasignado exitosamente' });
  } catch (err) {
    logger.error('Error al desasignar envío de revisor', { error: err.message });
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// 7. Obtener todas las asignaciones de revisores (Admin)
router.get('/revisores/asignaciones', verifyToken, checkAdminOrEditor, async (req, res) => {
  try {
    const query = `
      SELECT revisor_id, envio_id FROM revisores_envios
    `;
    const { rows } = await db.query(query);
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Error al obtener asignaciones de revisores', { error: err.message });
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// 8. Crear o actualizar evaluación para un envío
router.post('/revisores/evaluar', verifyToken, async (req, res) => {
  try {
    const { envioId, scoreScientific, scoreOriginality, scorePresentation, comments, approved } = req.body;
    const revisorId = req.user.id;

    if (!envioId || scoreScientific === undefined || scoreOriginality === undefined || scorePresentation === undefined || !comments) {
      return res.status(400).json({ success: false, error: 'Faltan campos obligatorios para la evaluación' });
    }

    // Verificar que el revisor tiene asignado este envío
    const checkAssignment = await db.query(
      'SELECT 1 FROM revisores_envios WHERE revisor_id = $1 AND envio_id = $2',
      [revisorId, envioId]
    );
    if (checkAssignment.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'No tienes autorizado evaluar este envío' });
    }

    const query = `
      INSERT INTO evaluaciones (envio_id, revisor_id, score_scientific, score_originality, score_presentation, comments, approved)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (envio_id, revisor_id) 
      DO UPDATE SET 
        score_scientific = EXCLUDED.score_scientific,
        score_originality = EXCLUDED.score_originality,
        score_presentation = EXCLUDED.score_presentation,
        comments = EXCLUDED.comments,
        approved = EXCLUDED.approved
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      envioId, revisorId, scoreScientific, scoreOriginality, scorePresentation, comments, approved
    ]);

    logger.info('Envío evaluado con éxito', { revisorId, envioId });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error('Error al guardar evaluación', { error: err.message });
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// 9. Obtener evaluación de un revisor para un envío
router.get('/revisores/evaluaciones/:envioId', verifyToken, async (req, res) => {
  try {
    const { envioId } = req.params;
    const revisorId = req.user.id;

    const query = `
      SELECT * FROM evaluaciones WHERE envio_id = $1 AND revisor_id = $2
    `;
    const { rows } = await db.query(query, [envioId, revisorId]);
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    logger.error('Error al obtener evaluación', { error: err.message });
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// 10. Obtener lista de revisores activos (Admin o Editor)
router.get('/revisores', verifyToken, checkAdminOrEditor, async (req, res) => {
  try {
    const query = `
      SELECT id, nombre, email, rol, is_active, created_at 
      FROM usuarios 
      WHERE rol = 'reviewer' AND is_active = true
      ORDER BY nombre ASC
    `;
    const { rows } = await db.query(query);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    logger.error('Error al obtener lista de revisores', { error: err.message });
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

module.exports = router;
