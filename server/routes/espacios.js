const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, isAdminOrOrganizer } = require('../middleware/auth');
const logger = require('../utils/logger');

// Obtener todos los espacios (filtrado por rol)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { rol, id } = req.user;
    
    let whereClause = '';
    let queryParams = [];

    if (rol !== 'admin') {
      whereClause = 'WHERE creador_id = $1';
      queryParams.push(id);
    }

    const query = `
      SELECT id, creador_id, nombre, tipo, ubicacion, descripcion, capacidad, equipamiento, enlace_virtual, observaciones, estado, created_at
      FROM espacios
      ${whereClause}
      ORDER BY nombre ASC
    `;
    
    const { rows } = await db.query(query, queryParams);
    
    const espacios = rows.map(row => {
      let equipArray = [];
      if (row.equipamiento) {
        try {
          equipArray = JSON.parse(row.equipamiento);
        } catch (e) {
          equipArray = typeof row.equipamiento === 'string' ? row.equipamiento.split(',').map(s => s.trim()) : [];
        }
      }
      return {
        ...row,
        equipamiento: equipArray
      };
    });

    res.json(espacios);
  } catch (err) {
    logger.error('Error al obtener espacios:', err);
    res.status(500).json({ error: 'Error interno del servidor al obtener espacios' });
  }
});

// Crear un nuevo espacio (solo admin u organizador)
router.post('/', [verifyToken, isAdminOrOrganizer], async (req, res) => {
  try {
    const { nombre, tipo, ubicacion, descripcion, capacidad, equipamiento, enlace_virtual, observaciones, estado } = req.body;
    
    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'Nombre y tipo son obligatorios' });
    }

    const query = `
      INSERT INTO espacios 
      (creador_id, nombre, tipo, ubicacion, descripcion, capacidad, equipamiento, enlace_virtual, observaciones, estado) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;
    
    const equipString = Array.isArray(equipamiento) ? JSON.stringify(equipamiento) : '[]';

    const { rows } = await db.query(query, [
      req.user.id, nombre, tipo, ubicacion, descripcion, capacidad || 0, equipString, enlace_virtual, observaciones, estado || 'Activo'
    ]);
    
    res.status(201).json({ 
      message: 'Espacio creado exitosamente',
      id: rows[0].id 
    });
  } catch (err) {
    logger.error('Error al crear espacio:', err);
    res.status(500).json({ error: 'Error al crear el espacio' });
  }
});

// Actualizar un espacio
router.put('/:id', [verifyToken, isAdminOrOrganizer], async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, ubicacion, descripcion, capacidad, equipamiento, enlace_virtual, observaciones, estado } = req.body;

    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'Nombre y tipo son obligatorios' });
    }

    const query = `
      UPDATE espacios 
      SET nombre = $1, tipo = $2, ubicacion = $3, descripcion = $4, capacidad = $5, 
          equipamiento = $6, enlace_virtual = $7, observaciones = $8, estado = $9
      WHERE id = $10
    `;
    
    const equipString = Array.isArray(equipamiento) ? JSON.stringify(equipamiento) : '[]';

    const { rowCount } = await db.query(query, [
      nombre, tipo, ubicacion, descripcion, capacidad || 0, equipString, enlace_virtual, observaciones, estado || 'Activo', id
    ]);
    
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Espacio no encontrado' });
    }
    
    res.json({ message: 'Espacio actualizado exitosamente' });
  } catch (err) {
    logger.error('Error al actualizar espacio:', err);
    res.status(500).json({ error: 'Error al actualizar el espacio' });
  }
});

// Eliminar (o desactivar) un espacio
router.delete('/:id', [verifyToken, isAdminOrOrganizer], async (req, res) => {
  try {
    const { id } = req.params;

    const query = `DELETE FROM espacios WHERE id = $1`;
    const { rowCount } = await db.query(query, [id]);
    
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Espacio no encontrado' });
    }
    
    res.json({ message: 'Espacio eliminado exitosamente' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'No se puede eliminar porque está en uso por uno o más congresos. Considere cambiar su estado a Inactivo.' });
    }
    logger.error('Error al eliminar espacio:', err);
    res.status(500).json({ error: 'Error al eliminar el espacio' });
  }
});

module.exports = router;
