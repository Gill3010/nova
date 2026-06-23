const db = require('../db');

class DecisionesRepository {
  /**
   * Crea una decisión editorial y actualiza el estado del envío en una transacción.
   */
  async create({ envioId, editorId, decision, justificacion }) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO decisiones_editoriales (envio_id, editor_id, decision, justificacion)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const { rows: [newDecision] } = await client.query(insertQuery, [
        envioId, editorId, decision, justificacion
      ]);

      await client.query(
        `UPDATE envios_ojs SET estado_editorial = $1 WHERE id = $2`,
        [decision, envioId]
      );

      await client.query('COMMIT');
      return newDecision;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Historial de decisiones para un envío, más reciente primero.
   */
  async findByEnvioId(envioId) {
    const query = `
      SELECT d.*, u.nombre AS editor_nombre, u.email AS editor_email
      FROM decisiones_editoriales d
      LEFT JOIN usuarios u ON d.editor_id = u.id
      WHERE d.envio_id = $1
      ORDER BY d.created_at DESC
    `;
    const { rows } = await db.query(query, [envioId]);
    return rows;
  }

  /**
   * Envíos pendientes de decisión editorial.
   * Un envío se considera "pendiente" si su estado_editorial es 'pending' o 'revision_required'
   * Y tiene al menos una evaluación de un revisor.
   */
  async findPendingEnvios() {
    const query = `
      SELECT 
        e.id, e.ojs_submission_id, e.titulo_articulo, e.resumen,
        e.nivel_academico, e.linea_investigacion, e.categoria,
        e.estado_editorial, e.created_at, e.autor_email,
        c.nombre AS congreso_nombre,
        COUNT(DISTINCT ev.id) AS total_evaluaciones,
        ROUND(AVG(ev.score_scientific)::numeric, 1) AS avg_scientific,
        ROUND(AVG(ev.score_originality)::numeric, 1) AS avg_originality,
        ROUND(AVG(ev.score_presentation)::numeric, 1) AS avg_presentation,
        COUNT(DISTINCT CASE WHEN ev.approved = true THEN ev.id END) AS aprobaciones,
        COUNT(DISTINCT CASE WHEN ev.approved = false THEN ev.id END) AS rechazos
      FROM envios_ojs e
      JOIN congresos c ON e.congreso_id = c.id
      LEFT JOIN evaluaciones ev ON ev.envio_id = e.id
      WHERE e.estado_editorial IN ('pending', 'revision_required')
      GROUP BY e.id, c.nombre, e.autor_email
      HAVING COUNT(DISTINCT ev.id) > 0
      ORDER BY e.created_at ASC
    `;
    const { rows } = await db.query(query);
    return rows;
  }

  /**
   * Dashboard completo del editor: todos los envíos con sus estadísticas de evaluación.
   */
  async findAllWithStatus() {
    const query = `
      SELECT 
        e.id, e.ojs_submission_id, e.titulo_articulo, e.resumen,
        e.nivel_academico, e.linea_investigacion, e.categoria,
        e.estado_editorial, e.created_at, e.archivo_key, e.autor_email,
        c.nombre AS congreso_nombre,
        c.ojs_url AS portal_url,
        c.ojs_api_key AS portal_api_key,
        c.ojs_journal_path AS revista_path,
        COUNT(DISTINCT ev.id) AS total_evaluaciones,
        ROUND(AVG(ev.score_scientific)::numeric, 1) AS avg_scientific,
        ROUND(AVG(ev.score_originality)::numeric, 1) AS avg_originality,
        ROUND(AVG(ev.score_presentation)::numeric, 1) AS avg_presentation,
        COUNT(DISTINCT CASE WHEN ev.approved = true THEN ev.id END) AS aprobaciones,
        COUNT(DISTINCT CASE WHEN ev.approved = false THEN ev.id END) AS rechazos,
        (SELECT rs.comments FROM revisiones_sistema rs WHERE rs.envio_id = e.id LIMIT 1) AS ia_comments,
        (SELECT rs.score_scientific FROM revisiones_sistema rs WHERE rs.envio_id = e.id LIMIT 1) AS ia_scientific,
        (SELECT rs.score_originality FROM revisiones_sistema rs WHERE rs.envio_id = e.id LIMIT 1) AS ia_originality,
        (SELECT rs.score_presentation FROM revisiones_sistema rs WHERE rs.envio_id = e.id LIMIT 1) AS ia_presentation,
        (SELECT d.decision FROM decisiones_editoriales d WHERE d.envio_id = e.id ORDER BY d.created_at DESC LIMIT 1) AS ultima_decision,
        (SELECT d.justificacion FROM decisiones_editoriales d WHERE d.envio_id = e.id ORDER BY d.created_at DESC LIMIT 1) AS ultima_justificacion,
        (SELECT d.created_at FROM decisiones_editoriales d WHERE d.envio_id = e.id ORDER BY d.created_at DESC LIMIT 1) AS fecha_decision,
        (SELECT u.nombre FROM decisiones_editoriales d JOIN usuarios u ON d.editor_id = u.id WHERE d.envio_id = e.id ORDER BY d.created_at DESC LIMIT 1) AS editor_nombre
      FROM envios_ojs e
      JOIN congresos c ON e.congreso_id = c.id
      LEFT JOIN evaluaciones ev ON ev.envio_id = e.id
      GROUP BY e.id, c.nombre, c.ojs_url, c.ojs_api_key, c.ojs_journal_path, e.autor_email
      ORDER BY 
        CASE e.estado_editorial
          WHEN 'pending' THEN 1
          WHEN 'revision_required' THEN 2
          WHEN 'accepted' THEN 3
          WHEN 'rejected' THEN 4
        END,
        e.created_at ASC
    `;
    const { rows } = await db.query(query);
    return rows;
  }

  /**
   * Obtiene las evaluaciones detalladas de un envío (para ver qué dijo cada revisor).
   */
  async findEvaluacionesByEnvioId(envioId) {
    const query = `
      SELECT ev.*, u.nombre AS revisor_nombre, u.email AS revisor_email
      FROM evaluaciones ev
      JOIN usuarios u ON ev.revisor_id = u.id
      WHERE ev.envio_id = $1
      ORDER BY ev.created_at ASC
    `;
    const { rows } = await db.query(query, [envioId]);
    return rows;
  }

  /**
   * Verifica que un envío existe.
   */
  async envioExists(envioId) {
    const { rows } = await db.query('SELECT id FROM envios_ojs WHERE id = $1', [envioId]);
    return rows.length > 0;
  }
}

module.exports = new DecisionesRepository();
