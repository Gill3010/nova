const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// 1. Obtener congresos con sus envíos (Dashboard)
router.get('/', verifyToken, (req, res) => {
  const { rol, id } = req.user;
  const scope = req.query.scope; // 'all' o 'mine'
  
  let whereClause = '';
  let queryParams = [];

  if (rol !== 'admin' && (scope === 'mine' || (rol === 'organizer' && scope !== 'all'))) {
    whereClause = 'WHERE c.creador_id = $1';
    queryParams.push(id);
  }

  const query = `
    SELECT 
      c.*,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'espacio_id', cs.espacio_id,
              'es_sede_principal', cs.es_sede_principal
            )
          )
          FROM congreso_sedes cs WHERE cs.congreso_id = c.id
        ),
        '[]'::json
      ) as sedes,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', e.id,
              'ojs_submission_id', e.ojs_submission_id,
              'titulo_articulo', e.titulo_articulo,
              'palabras_claves', e.palabras_claves,
              'colaboradores', e.colaboradores,
              'revista_destino', e.revista_destino,
              'categoria', e.categoria,
              'autor_email', e.autor_email,
              'created_at', e.created_at
            )
          )
          FROM envios_ojs e WHERE e.congreso_id = c.id
        ),
        '[]'::json
      ) as envios
    FROM congresos c
    ${whereClause}
    ORDER BY c.created_at DESC;
  `;
  
  db.all(query, queryParams, (err, rows) => {
    if (err) {
      logger.error('Error consultando congresos en BD', { error: err.message, userId: id });
      return res.status(500).json({ success: false, error: 'Error interno al consultar la base de datos' });
    }
    
    const formattedRows = rows.map(row => {
      let enviosArray = [];
      let sedesArray = [];
      try {
        if (row.envios) {
          if (typeof row.envios === 'string' && row.envios !== '[]') {
            const parsed = JSON.parse(row.envios);
            enviosArray = parsed.filter(e => e.id !== null);
          } else if (Array.isArray(row.envios)) {
            enviosArray = row.envios.filter(e => e.id !== null);
          }
        }
        if (row.sedes) {
          if (typeof row.sedes === 'string' && row.sedes !== '[]') {
            sedesArray = JSON.parse(row.sedes).filter(s => s.espacio_id !== null);
          } else if (Array.isArray(row.sedes)) {
            sedesArray = row.sedes.filter(s => s.espacio_id !== null);
          }
        }
      } catch (e) {
        logger.warn('Error al procesar JSON desde BD', { rowId: row.id, error: e.message });
      }
      return { ...row, envios: enviosArray, sedes: sedesArray };
    });

    res.status(200).json({ success: true, data: formattedRows });
  });
});

// 2. Guardar un nuevo congreso con validación de inputs
router.post('/', verifyToken, (req, res) => {
  const {
    nombre,
    descripcion,
    fecha_celebracion,
    fecha_finalizacion,
    sede,
    modalidad,
    nivel_academico,
    linea_investigacion,
    aula_canal,
    ojs_url,
    ojs_api_key,
    ojs_journal_path,
    ojs_submission_id,
    ojs_publication_id,
    espacio_id,
    espaciosIds // Nuevo: array de IDs
  } = req.body;
  const creador_id = req.user.id;
  
  // Retrocompatibilidad o seteo del primary space
  const primarySpaceId = (espaciosIds && espaciosIds.length > 0) ? espaciosIds[0] : (espacio_id || null);

  // Validación de inputs
  if (!nombre || !nombre.trim()) {
    logger.warn('Creación de congreso rechazada: nombre vacío', { creador_id });
    return res.status(400).json({ success: false, error: 'El nombre del congreso es obligatorio' });
  }

  const modalidadesPermitidas = ['presencial', 'virtual', 'hibrido', 'híbrido', 'hibrida', 'híbrida'];
  if (modalidad && !modalidadesPermitidas.includes(modalidad.toLowerCase())) {
    logger.warn('Creación de congreso rechazada: modalidad inválida', { creador_id, modalidad });
    return res.status(400).json({ success: false, error: 'Modalidad de congreso no válida' });
  }

  // Validación de rango de fechas
  if (fecha_celebracion && fecha_finalizacion && new Date(fecha_finalizacion) < new Date(fecha_celebracion)) {
    logger.warn('Creación de congreso rechazada: rango de fechas inválido', { creador_id, fecha_celebracion, fecha_finalizacion });
    return res.status(400).json({ success: false, error: 'La fecha de finalización no puede ser anterior a la fecha de inicio' });
  }

  const query = `
    INSERT INTO congresos 
      (creador_id, nombre, descripcion, fecha_celebracion, fecha_finalizacion, sede, modalidad, nivel_academico, linea_investigacion, aula_canal, ojs_url, ojs_api_key, ojs_journal_path, ojs_submission_id, ojs_publication_id, espacio_id) 
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
  `;
  const values = [
    creador_id,
    nombre.trim(),
    descripcion ? descripcion.trim() : null,
    fecha_celebracion,
    fecha_finalizacion || null,
    sede ? sede.trim() : null,
    modalidad,
    nivel_academico,
    linea_investigacion ? linea_investigacion.trim() : null,
    aula_canal ? aula_canal.trim() : null,
    ojs_url ? ojs_url.trim() : null,
    ojs_api_key ? ojs_api_key.trim() : null,
    ojs_journal_path ? ojs_journal_path.trim() : null,
    ojs_submission_id || null,
    ojs_publication_id || null,
    primarySpaceId
  ];
  
  db.run(query, values, async function(err) {
    if (err) {
      logger.error('Error insertando congreso en BD', { error: err.message, creador_id });
      return res.status(500).json({ success: false, error: 'Error interno del servidor al guardar el congreso' });
    }
    
    const insertedId = this.lastID;
    logger.info('Congreso registrado con éxito', { insertedId, creador_id });
    
    if (espaciosIds && Array.isArray(espaciosIds) && espaciosIds.length > 0) {
      try {
        for (let i = 0; i < espaciosIds.length; i++) {
          await db.query(
            `INSERT INTO congreso_sedes (congreso_id, espacio_id, es_sede_principal) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [insertedId, espaciosIds[i], i === 0]
          );
        }
      } catch (e) {
        logger.error('Error guardando sedes del congreso', { error: e.message });
      }
    }
    
    db.get(`SELECT * FROM congresos WHERE id = $1`, [insertedId], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Congreso guardado pero hubo error al recuperarlo' });
      }
      res.status(201).json({ success: true, congreso: row });
    });
  });
});

// 3. Actualizar un congreso existente con validación de inputs
router.put('/:id', verifyToken, (req, res) => {
  const congressId = req.params.id;
  const {
    nombre, descripcion, fecha_celebracion, fecha_finalizacion, sede, modalidad,
    nivel_academico, linea_investigacion, aula_canal,
    ojs_url, ojs_api_key, ojs_journal_path,
    ojs_submission_id, ojs_publication_id, espacio_id,
    espaciosIds
  } = req.body;
  const userId = req.user.id;
  const rol = req.user.rol;
  
  const primarySpaceId = (espaciosIds && espaciosIds.length > 0) ? espaciosIds[0] : (espacio_id || null);

  // Validación de inputs
  if (!nombre || !nombre.trim()) {
    logger.warn('Actualización de congreso rechazada: nombre vacío', { congressId, userId });
    return res.status(400).json({ success: false, error: 'El nombre del congreso es obligatorio' });
  }

  // Validación de rango de fechas
  if (fecha_celebracion && fecha_finalizacion && new Date(fecha_finalizacion) < new Date(fecha_celebracion)) {
    logger.warn('Actualización de congreso rechazada: rango de fechas inválido', { congressId, userId, fecha_celebracion, fecha_finalizacion });
    return res.status(400).json({ success: false, error: 'La fecha de finalización no puede ser anterior a la fecha de inicio' });
  }

  let query = `
    UPDATE congresos 
    SET nombre = $1, descripcion = $2, fecha_celebracion = $3, fecha_finalizacion = $4, sede = $5, 
        modalidad = $6, nivel_academico = $7, linea_investigacion = $8, aula_canal = $9,
        ojs_url = $10, ojs_api_key = $11, ojs_journal_path = $12,
        ojs_submission_id = $13, ojs_publication_id = $14, espacio_id = $15
  `;
  let values = [
    nombre.trim(),
    descripcion ? descripcion.trim() : null,
    fecha_celebracion,
    fecha_finalizacion || null,
    sede ? sede.trim() : null,
    modalidad,
    nivel_academico,
    linea_investigacion ? linea_investigacion.trim() : null,
    aula_canal ? aula_canal.trim() : null,
    ojs_url ? ojs_url.trim() : null,
    ojs_api_key ? ojs_api_key.trim() : null,
    ojs_journal_path ? ojs_journal_path.trim() : null,
    ojs_submission_id || null,
    ojs_publication_id || null,
    primarySpaceId
  ];
  let counter = 16;

  if (rol !== 'admin') {
    query += ` WHERE id = $${counter++} AND creador_id = $${counter++}`;
    values.push(congressId);
    values.push(userId);
  } else {
    query += ` WHERE id = $${counter++}`;
    values.push(congressId);
  }

  db.run(query, values, async function(err) {
    if (err) {
      logger.error('Error actualizando congreso en BD', { error: err.message, congressId, userId });
      return res.status(500).json({ success: false, error: 'Error interno del servidor al actualizar' });
    }
    if (this.changes === 0) {
      logger.warn('Intento de actualización fallido: congreso no encontrado o no autorizado', { congressId, userId });
      return res.status(404).json({ success: false, error: 'Congreso no encontrado o no autorizado' });
    }
    
    if (espaciosIds && Array.isArray(espaciosIds)) {
      try {
        await db.query(`DELETE FROM congreso_sedes WHERE congreso_id = $1`, [congressId]);
        for (let i = 0; i < espaciosIds.length; i++) {
          await db.query(
            `INSERT INTO congreso_sedes (congreso_id, espacio_id, es_sede_principal) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [congressId, espaciosIds[i], i === 0]
          );
        }
      } catch (e) {
        logger.error('Error actualizando sedes', { error: e.message });
      }
    }

    logger.info('Congreso actualizado exitosamente', { congressId, userId });
    res.json({ success: true, message: 'Congreso actualizado exitosamente' });
  });
});

module.exports = router;
