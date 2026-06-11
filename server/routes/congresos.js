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
              'created_at', e.created_at,
              'revista_ojs_id', e.revista_ojs_id
            )
          )
          FROM envios_ojs e WHERE e.congreso_id = c.id
        ),
        '[]'::json
      ) as envios,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'portal_ojs_id', p.id,
              'ojs_url', p.ojs_url,
              'portal_nombre', p.nombre
            )
          )
          FROM congreso_portal_ojs cp
          JOIN portales_ojs p ON p.id = cp.portal_ojs_id
          WHERE cp.congreso_id = c.id
        ),
        '[]'::json
      ) as portales_ojs
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
      let portalesOjsArray = [];
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
        if (row.portales_ojs) {
          if (typeof row.portales_ojs === 'string' && row.portales_ojs !== '[]') {
            portalesOjsArray = JSON.parse(row.portales_ojs).filter(p => p.portal_ojs_id !== null);
          } else if (Array.isArray(row.portales_ojs)) {
            portalesOjsArray = row.portales_ojs.filter(p => p.portal_ojs_id !== null);
          }
        }
      } catch (e) {
        logger.warn('Error al procesar JSON desde BD', { rowId: row.id, error: e.message });
      }
      return { ...row, envios: enviosArray, sedes: sedesArray, portales_ojs: portalesOjsArray };
    });

    res.status(200).json({ success: true, data: formattedRows });
  });
});

// 2. Guardar un nuevo congreso con validación de inputs
router.post('/', verifyToken, async (req, res) => {
  const {
    nombre,
    lema,
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
    espaciosIds, // Nuevo: array de IDs
    portal_ojs_id // Nuevo: ID del portal OJS a asociar
  } = req.body;
  const creador_id = req.user.id;
  
  // Retrocompatibilidad o seteo del primary space
  let finalPrimarySpaceId = (espaciosIds && espaciosIds.length > 0) ? espaciosIds[0] : (espacio_id || null);
  let finalEspaciosIds = espaciosIds ? [...espaciosIds] : [];

  if (sede && sede.trim() !== '') {
    const sedeName = sede.trim();
    try {
      // Buscar si existe algún espacio con esta misma ubicación/institución y nombre genérico
      const resQuery = await db.query(`SELECT id FROM espacios WHERE nombre = 'Espacio Principal' AND ubicacion ILIKE $1 LIMIT 1`, [sedeName]);
      if (resQuery.rows && resQuery.rows.length > 0) {
        finalPrimarySpaceId = resQuery.rows[0].id;
      } else {
        const insertRes = await db.query(
          `INSERT INTO espacios (creador_id, nombre, tipo, ubicacion, estado) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [creador_id, 'Espacio Principal', 'física', sedeName, 'Activo']
        );
        if (insertRes.rows && insertRes.rows.length > 0) {
          finalPrimarySpaceId = insertRes.rows[0].id;
        }
      }
      
      if (finalPrimarySpaceId) {
        finalEspaciosIds = finalEspaciosIds.filter(id => id !== finalPrimarySpaceId);
        finalEspaciosIds.unshift(finalPrimarySpaceId);
      }
    } catch (error) {
      logger.error('Error al autogestionar sede principal', { error: error.message });
    }
  }

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
      (creador_id, nombre, lema, descripcion, fecha_celebracion, fecha_finalizacion, sede, modalidad, nivel_academico, linea_investigacion, aula_canal, ojs_url, ojs_api_key, ojs_journal_path, ojs_submission_id, ojs_publication_id, espacio_id) 
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
  `;
  const values = [
    creador_id,
    nombre.trim(),
    lema ? lema.trim() : null,
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
    finalPrimarySpaceId
  ];
  
  db.run(query, values, async function(err) {
    if (err) {
      logger.error('Error insertando congreso en BD', { error: err.message, creador_id });
      return res.status(500).json({ success: false, error: 'Error interno del servidor al guardar el congreso', details: err.message });
    }
    
    const insertedId = this.lastID;
    logger.info('Congreso registrado con éxito', { insertedId, creador_id });
    
    if (finalEspaciosIds && Array.isArray(finalEspaciosIds) && finalEspaciosIds.length > 0) {
      try {
        for (let i = 0; i < finalEspaciosIds.length; i++) {
          await db.query(
            `INSERT INTO congreso_sedes (congreso_id, espacio_id, es_sede_principal) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [insertedId, finalEspaciosIds[i], i === 0]
          );
        }
      } catch (e) {
        logger.error('Error guardando sedes del congreso', { error: e.message });
      }
    }
    
    // Asociar portal OJS si se proporcionó
    if (portal_ojs_id) {
      try {
        await db.query(
          `INSERT INTO congreso_portal_ojs (congreso_id, portal_ojs_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [insertedId, portal_ojs_id]
        );
      } catch (e) {
        logger.error('Error asociando portal OJS al congreso', { error: e.message });
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
router.put('/:id', verifyToken, async (req, res) => {
  const congressId = req.params.id;
  const {
    nombre, lema, descripcion, fecha_celebracion, fecha_finalizacion, sede, modalidad,
    nivel_academico, linea_investigacion, aula_canal,
    ojs_url, ojs_api_key, ojs_journal_path,
    ojs_submission_id, ojs_publication_id, espacio_id,
    espaciosIds
  } = req.body;
  const userId = req.user.id;
  const rol = req.user.rol;
  
  let finalPrimarySpaceId = (espaciosIds && espaciosIds.length > 0) ? espaciosIds[0] : (espacio_id || null);
  let finalEspaciosIds = espaciosIds ? [...espaciosIds] : [];

  if (sede && sede.trim() !== '') {
    const sedeName = sede.trim();
    try {
      // Buscar si existe algún espacio con esta misma ubicación/institución y nombre genérico
      const resQuery = await db.query(`SELECT id FROM espacios WHERE nombre = 'Espacio Principal' AND ubicacion ILIKE $1 LIMIT 1`, [sedeName]);
      if (resQuery.rows && resQuery.rows.length > 0) {
        finalPrimarySpaceId = resQuery.rows[0].id;
      } else {
        const insertRes = await db.query(
          `INSERT INTO espacios (creador_id, nombre, tipo, ubicacion, estado) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [userId, 'Espacio Principal', 'física', sedeName, 'Activo']
        );
        if (insertRes.rows && insertRes.rows.length > 0) {
          finalPrimarySpaceId = insertRes.rows[0].id;
        }
      }
      
      if (finalPrimarySpaceId) {
        finalEspaciosIds = finalEspaciosIds.filter(id => id !== finalPrimarySpaceId);
        finalEspaciosIds.unshift(finalPrimarySpaceId);
      }
    } catch (error) {
      logger.error('Error al autogestionar sede principal en PUT', { error: error.message });
    }
  }

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
    SET nombre = $1, lema = $2, descripcion = $3, fecha_celebracion = $4, fecha_finalizacion = $5, sede = $6, 
        modalidad = $7, nivel_academico = $8, linea_investigacion = $9, aula_canal = $10,
        ojs_url = $11, ojs_api_key = $12, ojs_journal_path = $13,
        ojs_submission_id = $14, ojs_publication_id = $15, espacio_id = $16
  `;
  let values = [
    nombre.trim(),
    lema ? lema.trim() : null,
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
    finalPrimarySpaceId
  ];
  let counter = 17;

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
    
    if (finalEspaciosIds && Array.isArray(finalEspaciosIds)) {
      try {
        await db.query(`DELETE FROM congreso_sedes WHERE congreso_id = $1`, [congressId]);
        for (let i = 0; i < finalEspaciosIds.length; i++) {
          await db.query(
            `INSERT INTO congreso_sedes (congreso_id, espacio_id, es_sede_principal) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [congressId, finalEspaciosIds[i], i === 0]
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
