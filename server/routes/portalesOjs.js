const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// ──────────────────────────────────────────────────────────────
// 1. Listar todos los portales OJS (con sus revistas)
// ──────────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', r.id,
                'ojs_journal_path', r.ojs_journal_path,
                'ojs_journal_id', r.ojs_journal_id,
                'nombre', r.nombre,
                'url', r.url,
                'habilitada', r.habilitada
              )
            )
            FROM revistas_ojs r WHERE r.portal_ojs_id = p.id
          ),
          '[]'::json
        ) as revistas
      FROM portales_ojs p
      ORDER BY p.created_at DESC;
    `;

    const { rows } = await db.query(query);

    const formatted = (rows || []).map(row => {
      let revistas = [];
      try {
        if (typeof row.revistas === 'string' && row.revistas !== '[]') {
          revistas = JSON.parse(row.revistas).filter(r => r.id !== null);
        } else if (Array.isArray(row.revistas)) {
          revistas = row.revistas.filter(r => r.id !== null);
        }
      } catch (e) { /* keep empty */ }
      return { ...row, revistas };
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    logger.error('Error al consultar portales OJS', { error: err.message });
    res.status(500).json({ success: false, error: 'Error interno al consultar portales OJS' });
  }
});

// ──────────────────────────────────────────────────────────────
// 2. Obtener un portal OJS por ID (con revistas)
// ──────────────────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const portalId = req.params.id;
    const query = `
      SELECT 
        p.*,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', r.id,
                'ojs_journal_path', r.ojs_journal_path,
                'ojs_journal_id', r.ojs_journal_id,
                'nombre', r.nombre,
                'url', r.url,
                'habilitada', r.habilitada
              )
            )
            FROM revistas_ojs r WHERE r.portal_ojs_id = p.id
          ),
          '[]'::json
        ) as revistas
      FROM portales_ojs p
      WHERE p.id = $1;
    `;

    const { rows } = await db.query(query, [portalId]);
    const row = rows[0];

    if (!row) {
      return res.status(404).json({ success: false, error: 'Portal OJS no encontrado' });
    }

    let revistas = [];
    try {
      if (typeof row.revistas === 'string' && row.revistas !== '[]') {
        revistas = JSON.parse(row.revistas).filter(r => r.id !== null);
      } else if (Array.isArray(row.revistas)) {
        revistas = row.revistas.filter(r => r.id !== null);
      }
    } catch (e) { /* keep empty */ }

    res.status(200).json({ success: true, data: { ...row, revistas } });
  } catch (err) {
    logger.error('Error al consultar portal OJS', { error: err.message, portalId: req.params.id });
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

// ──────────────────────────────────────────────────────────────
// 3. Crear o actualizar un portal OJS (upsert por URL)
// ──────────────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { rol } = req.user;
  if (rol !== 'admin' && rol !== 'organizer') {
    return res.status(403).json({ success: false, error: 'No autorizado para gestionar portales OJS' });
  }

  const { ojs_url, ojs_api_key, nombre, ojs_service_user, ojs_service_password } = req.body;

  if (!ojs_url || !ojs_url.trim()) {
    return res.status(400).json({ success: false, error: 'La URL del portal OJS es requerida' });
  }
  if (!ojs_api_key || !ojs_api_key.trim()) {
    return res.status(400).json({ success: false, error: 'El API Key del portal OJS es requerido' });
  }

  try {
    // Upsert: si ya existe un portal con esa URL, actualizar el API key y credenciales de servicio
    const result = await db.query(`
      INSERT INTO portales_ojs (ojs_url, ojs_api_key, nombre, ojs_service_user, ojs_service_password)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (ojs_url) DO UPDATE SET
        ojs_api_key = EXCLUDED.ojs_api_key,
        nombre = COALESCE(EXCLUDED.nombre, portales_ojs.nombre),
        ojs_service_user = COALESCE(EXCLUDED.ojs_service_user, portales_ojs.ojs_service_user),
        ojs_service_password = COALESCE(EXCLUDED.ojs_service_password, portales_ojs.ojs_service_password)
      RETURNING *;
    `, [
      ojs_url.trim(), 
      ojs_api_key.trim(), 
      nombre ? nombre.trim() : ojs_url.trim(),
      ojs_service_user ? ojs_service_user.trim() : null,
      ojs_service_password ? ojs_service_password : null
    ]);

    const portal = result.rows[0];
    logger.info('Portal OJS registrado/actualizado', { portalId: portal.id, url: ojs_url });
    res.status(201).json({ success: true, portal });
  } catch (err) {
    logger.error('Error al crear portal OJS', { error: err.message });
    res.status(500).json({ success: false, error: 'Error interno al registrar el portal OJS' });
  }
});

// ──────────────────────────────────────────────────────────────
// 4. Registrar revistas en un portal OJS (batch upsert)
// ──────────────────────────────────────────────────────────────
router.post('/:id/revistas', verifyToken, async (req, res) => {
  const { rol } = req.user;
  if (rol !== 'admin' && rol !== 'organizer') {
    return res.status(403).json({ success: false, error: 'No autorizado' });
  }

  const portalId = req.params.id;
  const { revistas } = req.body; // Array de { ojs_journal_path, ojs_journal_id, nombre, url, habilitada }

  if (!Array.isArray(revistas) || revistas.length === 0) {
    return res.status(400).json({ success: false, error: 'Debe proporcionar un arreglo de revistas' });
  }

  try {
    const inserted = [];
    for (const revista of revistas) {
      if (!revista.ojs_journal_path) continue;

      const result = await db.query(`
        INSERT INTO revistas_ojs (portal_ojs_id, ojs_journal_path, ojs_journal_id, nombre, url, habilitada)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (portal_ojs_id, ojs_journal_path) DO UPDATE SET
          ojs_journal_id = COALESCE(EXCLUDED.ojs_journal_id, revistas_ojs.ojs_journal_id),
          nombre = COALESCE(EXCLUDED.nombre, revistas_ojs.nombre),
          url = COALESCE(EXCLUDED.url, revistas_ojs.url),
          habilitada = COALESCE(EXCLUDED.habilitada, revistas_ojs.habilitada)
        RETURNING *;
      `, [
        portalId,
        revista.ojs_journal_path.trim(),
        revista.ojs_journal_id || null,
        revista.nombre || null,
        revista.url || null,
        revista.habilitada !== undefined ? revista.habilitada : true
      ]);

      if (result.rows[0]) inserted.push(result.rows[0]);
    }

    logger.info('Revistas sincronizadas en portal OJS', { portalId, count: inserted.length });
    res.status(201).json({ success: true, revistas: inserted });
  } catch (err) {
    logger.error('Error al registrar revistas OJS', { error: err.message, portalId });
    res.status(500).json({ success: false, error: 'Error interno al registrar revistas' });
  }
});

// ──────────────────────────────────────────────────────────────
// 5. Obtener revistas de un portal OJS
// ──────────────────────────────────────────────────────────────
router.get('/:id/revistas', verifyToken, async (req, res) => {
  try {
    const portalId = req.params.id;
    const { rows } = await db.query(
      `SELECT * FROM revistas_ojs WHERE portal_ojs_id = $1 ORDER BY nombre ASC`,
      [portalId]
    );
    res.status(200).json({ success: true, data: rows || [] });
  } catch (err) {
    logger.error('Error al consultar revistas del portal', { error: err.message, portalId: req.params.id });
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

// ──────────────────────────────────────────────────────────────
// 6. Asociar un portal OJS a un congreso
// ──────────────────────────────────────────────────────────────
router.post('/:id/congresos/:congresoId', verifyToken, async (req, res) => {
  const { rol } = req.user;
  if (rol !== 'admin' && rol !== 'organizer') {
    return res.status(403).json({ success: false, error: 'No autorizado' });
  }

  const portalId = req.params.id;
  const congresoId = req.params.congresoId;

  try {
    await db.query(`
      INSERT INTO congreso_portal_ojs (congreso_id, portal_ojs_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING;
    `, [congresoId, portalId]);

    logger.info('Portal OJS asociado a congreso', { portalId, congresoId });
    res.status(201).json({ success: true, message: 'Portal OJS asociado al congreso' });
  } catch (err) {
    logger.error('Error al asociar portal OJS a congreso', { error: err.message });
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

// ──────────────────────────────────────────────────────────────
// 7. Obtener las revistas disponibles para un congreso
//    (a través de los portales asociados al congreso)
// ──────────────────────────────────────────────────────────────
router.get('/congreso/:congresoId/revistas', verifyToken, async (req, res) => {
  try {
    const congresoId = req.params.congresoId;

    const query = `
      SELECT 
        r.id,
        r.portal_ojs_id,
        r.ojs_journal_path,
        r.ojs_journal_id,
        r.nombre,
        r.url,
        r.habilitada,
        p.ojs_url as portal_url,
        p.ojs_api_key as portal_api_key,
        p.nombre as portal_nombre
      FROM revistas_ojs r
      JOIN portales_ojs p ON p.id = r.portal_ojs_id
      JOIN congreso_portal_ojs cp ON cp.portal_ojs_id = p.id
      WHERE cp.congreso_id = $1 AND p.habilitado = true
      ORDER BY p.nombre ASC, r.nombre ASC;
    `;

    const { rows } = await db.query(query, [congresoId]);
    res.status(200).json({ success: true, data: rows || [] });
  } catch (err) {
    logger.error('Error al consultar revistas del congreso', { error: err.message, congresoId: req.params.congresoId });
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

module.exports = router;
