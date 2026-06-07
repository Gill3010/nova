const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Regex para validación de formato de email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 1. Obtener envíos del usuario actual
router.get('/me', verifyToken, (req, res) => {
  const usuario_id = req.user.id;
  const query = `
    SELECT 
      e.id,
      e.ojs_submission_id,
      e.ojs_publication_id,
      e.titulo_articulo,
      e.palabras_claves,
      e.colaboradores,
      e.categoria,
      e.created_at,
      e.congreso_id,
      c.nombre AS congreso_nombre
    FROM envios_ojs e
    JOIN congresos c ON e.congreso_id = c.id
    WHERE e.usuario_id = $1
    ORDER BY e.created_at DESC
  `;

  db.all(query, [usuario_id], (err, rows) => {
    if (err) {
      logger.error('Error al obtener los envíos del usuario en BD', { error: err.message, usuario_id });
      return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
    res.status(200).json({ success: true, data: rows });
  });
});

// 2. Registrar un nuevo envío de OJS con validación de inputs
router.post('/', verifyToken, (req, res) => {
  const { 
    congreso_id, ojs_submission_id, ojs_publication_id, 
    categoria, autor_email, titulo_articulo, palabras_claves, colaboradores, revista_destino 
  } = req.body;
  const usuario_id = req.user.id;

  // Validación de inputs obligatorios
  if (!congreso_id) {
    logger.warn('Registro de envío OJS fallido: falta congreso_id', { usuario_id });
    return res.status(400).json({ success: false, error: 'El ID del congreso es requerido' });
  }
  if (!ojs_submission_id) {
    logger.warn('Registro de envío OJS fallido: falta ojs_submission_id', { usuario_id });
    return res.status(400).json({ success: false, error: 'El ID de envío de OJS es requerido' });
  }
  if (!titulo_articulo || !titulo_articulo.trim()) {
    logger.warn('Registro de envío OJS fallido: titulo_articulo vacío', { usuario_id });
    return res.status(400).json({ success: false, error: 'El título del artículo es requerido' });
  }

  // Validación de email
  if (autor_email && !EMAIL_REGEX.test(autor_email)) {
    logger.warn('Registro de envío OJS fallido: formato email del autor inválido', { usuario_id, autor_email });
    return res.status(400).json({ success: false, error: 'El correo electrónico del autor no tiene un formato válido' });
  }

  const query = `
    INSERT INTO envios_ojs 
      (congreso_id, usuario_id, ojs_submission_id, ojs_publication_id, categoria, autor_email, titulo_articulo, palabras_claves, colaboradores, revista_destino) 
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `;
  const values = [
    congreso_id,
    usuario_id,
    ojs_submission_id,
    ojs_publication_id || null,
    categoria,
    autor_email ? autor_email.trim().toLowerCase() : null,
    titulo_articulo.trim(),
    palabras_claves ? palabras_claves.trim() : null,
    colaboradores, // Se almacena como string JSON o texto de colaboradores
    revista_destino ? revista_destino.trim() : null
  ];
  
  db.run(query, values, function(err) {
    if (err) {
      logger.error('Error insertando envío OJS en BD', { error: err.message, usuario_id });
      return res.status(500).json({ success: false, error: 'Error interno del servidor al registrar el envío' });
    }
    const insertedId = this.lastID;
    logger.info('Envío de OJS registrado con éxito', { insertedId, ojs_submission_id, usuario_id });
    
    db.get(`SELECT * FROM envios_ojs WHERE id = $1`, [insertedId], (err, row) => {
      res.status(201).json({ success: true, envio: row });
    });
  });
});

// 3. Actualizar un envío de OJS existente con validación de inputs
router.put('/:id', verifyToken, (req, res) => {
  const envioId = req.params.id;
  const { titulo_articulo, palabras_claves, colaboradores, categoria, congreso_id } = req.body;
  const userId = req.user.id;
  const rol = req.user.rol;
  
  // Validación de inputs obligatorios
  if (!titulo_articulo || !titulo_articulo.trim()) {
    logger.warn('Actualización de envío OJS fallida: titulo_articulo vacío', { envioId, userId });
    return res.status(400).json({ success: false, error: 'El título del artículo es requerido' });
  }

  let query = `
    UPDATE envios_ojs
    SET titulo_articulo = $1, palabras_claves = $2, colaboradores = $3, categoria = $4
  `;
  let values = [
    titulo_articulo.trim(),
    palabras_claves ? palabras_claves.trim() : null,
    colaboradores,
    categoria
  ];
  let counter = 5;

  if (congreso_id) {
    query += `, congreso_id = $${counter++}`;
    values.push(congreso_id);
  }

  query += ` WHERE id = $${counter++}`;
  values.push(envioId);

  if (rol !== 'admin') {
    query += ` AND usuario_id = $${counter++}`;
    values.push(userId);
  }

  db.run(query, values, function(err) {
    if (err) {
      logger.error('Error actualizando envío OJS en BD', { error: err.message, envioId, userId });
      return res.status(500).json({ success: false, error: 'Error interno del servidor al actualizar el envío' });
    }
    if (this.changes === 0) {
      logger.warn('Intento de actualización fallido: envío no encontrado o no autorizado', { envioId, userId });
      return res.status(404).json({ success: false, error: 'Envío no encontrado o no autorizado' });
    }
    logger.info('Envío de OJS actualizado con éxito', { envioId, userId });
    res.json({ success: true, message: 'Envío actualizado exitosamente' });
  });
});

module.exports = router;
