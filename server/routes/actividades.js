const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, isAdminOrOrganizer } = require('../middleware/auth');
const logger = require('../utils/logger');

// Obtener actividades de un congreso
router.get('/congreso/:id', verifyToken, async (req, res) => {
  try {
    const congresoId = req.params.id;
    
    const query = `
      SELECT a.*, e.nombre as espacio_nombre, e.tipo as espacio_tipo, e.ubicacion as espacio_ubicacion, e.enlace_virtual as espacio_enlace_virtual
      FROM actividades a
      LEFT JOIN espacios e ON a.espacio_id = e.id
      WHERE a.congreso_id = $1
      ORDER BY a.fecha ASC, a.hora_inicio ASC
    `;
    
    const { rows } = await db.query(query, [congresoId]);
    res.json(rows);
  } catch (err) {
    logger.error('Error al obtener actividades:', err);
    res.status(500).json({ error: 'Error interno del servidor al obtener actividades' });
  }
});

// Crear nueva actividad
router.post('/', [verifyToken, isAdminOrOrganizer], async (req, res) => {
  try {
    const { congreso_id, espacio_id, titulo, descripcion, fecha, hora_inicio, hora_fin, enlace_virtual, foto_ponente, estado } = req.body;
    
    if (!titulo || !congreso_id) {
      return res.status(400).json({ error: 'El título y el congreso son obligatorios' });
    }

    const query = `
      INSERT INTO actividades (congreso_id, espacio_id, titulo, descripcion, fecha, hora_inicio, hora_fin, enlace_virtual, foto_ponente, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;
    const values = [congreso_id, espacio_id || null, titulo, descripcion, fecha, hora_inicio, hora_fin, enlace_virtual, foto_ponente || null, estado || 'Programada'];

    const { rows } = await db.query(query, values);
    res.status(201).json({ message: 'Actividad creada exitosamente', id: rows[0].id });
  } catch (err) {
    logger.error('Error al crear actividad:', err);
    res.status(500).json({ error: 'Error al crear la actividad' });
  }
});

// Actualizar actividad
router.put('/:id', [verifyToken, isAdminOrOrganizer], async (req, res) => {
  try {
    const { id } = req.params;
    const { espacio_id, titulo, descripcion, fecha, hora_inicio, hora_fin, enlace_virtual, foto_ponente, estado } = req.body;
    
    const query = `
      UPDATE actividades 
      SET espacio_id = $1, titulo = $2, descripcion = $3, fecha = $4, hora_inicio = $5, hora_fin = $6, enlace_virtual = $7, foto_ponente = $8, estado = $9
      WHERE id = $10
    `;
    const values = [espacio_id || null, titulo, descripcion, fecha, hora_inicio, hora_fin, enlace_virtual, foto_ponente || null, estado, id];

    const { rowCount } = await db.query(query, values);
    if (rowCount === 0) return res.status(404).json({ error: 'Actividad no encontrada' });
    
    res.json({ message: 'Actividad actualizada exitosamente' });
  } catch (err) {
    logger.error('Error al actualizar actividad:', err);
    res.status(500).json({ error: 'Error al actualizar la actividad' });
  }
});

// Eliminar actividad
router.delete('/:id', [verifyToken, isAdminOrOrganizer], async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rowCount } = await db.query(`DELETE FROM actividades WHERE id = $1`, [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Actividad no encontrada' });
    
    res.json({ message: 'Actividad eliminada exitosamente' });
  } catch (err) {
    logger.error('Error al eliminar actividad:', err);
    res.status(500).json({ error: 'Error al eliminar la actividad' });
  }
});

module.exports = router;
