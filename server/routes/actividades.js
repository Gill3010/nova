const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, isAdminOrOrganizer } = require('../middleware/auth');
const logger = require('../utils/logger');

// Obtener actividades de un congreso
router.get('/congreso/:id', verifyToken, (req, res) => {
  const congresoId = req.params.id;
  
  const query = `
    SELECT a.*, e.nombre as espacio_nombre, e.tipo as espacio_tipo, e.ubicacion as espacio_ubicacion, e.enlace_virtual as espacio_enlace_virtual
    FROM actividades a
    LEFT JOIN espacios e ON a.espacio_id = e.id
    WHERE a.congreso_id = $1
    ORDER BY a.fecha ASC, a.hora_inicio ASC
  `;
  
  db.all(query, [congresoId], (err, rows) => {
    if (err) {
      logger.error('Error al obtener actividades:', err);
      return res.status(500).json({ error: 'Error interno del servidor al obtener actividades' });
    }
    res.json(rows);
  });
});

// Crear nueva actividad
router.post('/', [verifyToken, isAdminOrOrganizer], (req, res) => {
  const { congreso_id, espacio_id, titulo, descripcion, fecha, hora_inicio, hora_fin, enlace_virtual, estado } = req.body;
  
  if (!titulo || !congreso_id) {
    return res.status(400).json({ error: 'El título y el congreso son obligatorios' });
  }

  const query = `
    INSERT INTO actividades (congreso_id, espacio_id, titulo, descripcion, fecha, hora_inicio, hora_fin, enlace_virtual, estado)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `;
  const values = [congreso_id, espacio_id || null, titulo, descripcion, fecha, hora_inicio, hora_fin, enlace_virtual, estado || 'Programada'];

  db.run(query, values, function(err) {
    if (err) {
      logger.error('Error al crear actividad:', err);
      return res.status(500).json({ error: 'Error al crear la actividad' });
    }
    res.status(201).json({ message: 'Actividad creada exitosamente', id: this.lastID });
  });
});

// Actualizar actividad
router.put('/:id', [verifyToken, isAdminOrOrganizer], (req, res) => {
  const { id } = req.params;
  const { espacio_id, titulo, descripcion, fecha, hora_inicio, hora_fin, enlace_virtual, estado } = req.body;
  
  const query = `
    UPDATE actividades 
    SET espacio_id = $1, titulo = $2, descripcion = $3, fecha = $4, hora_inicio = $5, hora_fin = $6, enlace_virtual = $7, estado = $8
    WHERE id = $9
  `;
  const values = [espacio_id || null, titulo, descripcion, fecha, hora_inicio, hora_fin, enlace_virtual, estado, id];

  db.run(query, values, function(err) {
    if (err) {
      logger.error('Error al actualizar actividad:', err);
      return res.status(500).json({ error: 'Error al actualizar la actividad' });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Actividad no encontrada' });
    res.json({ message: 'Actividad actualizada exitosamente' });
  });
});

// Eliminar actividad
router.delete('/:id', [verifyToken, isAdminOrOrganizer], (req, res) => {
  const { id } = req.params;
  
  db.run(`DELETE FROM actividades WHERE id = $1`, [id], function(err) {
    if (err) {
      logger.error('Error al eliminar actividad:', err);
      return res.status(500).json({ error: 'Error al eliminar la actividad' });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Actividad no encontrada' });
    res.json({ message: 'Actividad eliminada exitosamente' });
  });
});

module.exports = router;
