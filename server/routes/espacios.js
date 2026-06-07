const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, isAdminOrOrganizer } = require('../middleware/auth');
const logger = require('../utils/logger');

// Obtener todos los espacios (público para poder listarlos en formularios, aunque podría requerir token)
router.get('/', verifyToken, (req, res) => {
  const query = `
    SELECT id, nombre, tipo, ubicacion, descripcion, capacidad, equipamiento, enlace_virtual, observaciones, estado, created_at
    FROM espacios
    ORDER BY nombre ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      logger.error('Error al obtener espacios:', err);
      return res.status(500).json({ error: 'Error interno del servidor al obtener espacios' });
    }
    
    // Convertir el equipamiento de texto (JSON si está guardado así) a arreglo
    const espacios = rows.map(row => {
      let equipArray = [];
      if (row.equipamiento) {
        try {
          equipArray = JSON.parse(row.equipamiento);
        } catch (e) {
          // Si no es JSON válido (ej: legacy string), convertirlo a array simple o separarlo por comas
          equipArray = row.equipamiento.split(',').map(s => s.trim());
        }
      }
      return {
        ...row,
        equipamiento: equipArray
      };
    });

    res.json(espacios);
  });
});

// Crear un nuevo espacio (solo admin u organizador)
router.post('/', [verifyToken, isAdminOrOrganizer], (req, res) => {
  const { nombre, tipo, ubicacion, descripcion, capacidad, equipamiento, enlace_virtual, observaciones, estado } = req.body;
  
  if (!nombre || !tipo) {
    return res.status(400).json({ error: 'Nombre y tipo son obligatorios' });
  }

  const query = `
    INSERT INTO espacios 
    (nombre, tipo, ubicacion, descripcion, capacidad, equipamiento, enlace_virtual, observaciones, estado) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `;
  
  const equipString = Array.isArray(equipamiento) ? JSON.stringify(equipamiento) : '[]';

  db.run(query, [nombre, tipo, ubicacion, descripcion, capacidad || 0, equipString, enlace_virtual, observaciones, estado || 'Activo'], function(err) {
    if (err) {
      logger.error('Error al crear espacio:', err);
      return res.status(500).json({ error: 'Error al crear el espacio' });
    }
    res.status(201).json({ 
      message: 'Espacio creado exitosamente',
      id: this.lastID 
    });
  });
});

// Actualizar un espacio
router.put('/:id', [verifyToken, isAdminOrOrganizer], (req, res) => {
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

  db.run(query, [nombre, tipo, ubicacion, descripcion, capacidad || 0, equipString, enlace_virtual, observaciones, estado || 'Activo', id], function(err) {
    if (err) {
      logger.error('Error al actualizar espacio:', err);
      return res.status(500).json({ error: 'Error al actualizar el espacio' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Espacio no encontrado' });
    }
    
    res.json({ message: 'Espacio actualizado exitosamente' });
  });
});

// Eliminar (o desactivar) un espacio
router.delete('/:id', [verifyToken, isAdminOrOrganizer], (req, res) => {
  const { id } = req.params;

  // En un sistema real, a menudo se prefiere desactivar en lugar de borrar si hay dependencias
  const query = `DELETE FROM espacios WHERE id = $1`;
  
  db.run(query, [id], function(err) {
    if (err) {
      // Si falla por foreign key (23503), sugerir desactivarlo o manejarlo de otra forma.
      if (err.code === '23503') {
        return res.status(400).json({ error: 'No se puede eliminar porque está en uso por uno o más congresos. Considere cambiar su estado a Inactivo.' });
      }
      logger.error('Error al eliminar espacio:', err);
      return res.status(500).json({ error: 'Error al eliminar el espacio' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Espacio no encontrado' });
    }
    
    res.json({ message: 'Espacio eliminado exitosamente' });
  });
});

module.exports = router;
