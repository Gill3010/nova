const db = require('../db');

class RevisionesRepository {
  /**
   * Guarda o actualiza el reporte de revisión preliminar del sistema para un envío.
   */
  async upsertSystemReport({ envioId, scoreScientific, scoreOriginality, scorePresentation, comments }) {
    const query = `
      INSERT INTO revisiones_sistema
        (envio_id, score_scientific, score_originality, score_presentation, comments)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (envio_id)
      DO UPDATE SET
        score_scientific  = EXCLUDED.score_scientific,
        score_originality = EXCLUDED.score_originality,
        score_presentation = EXCLUDED.score_presentation,
        comments = EXCLUDED.comments,
        created_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      envioId, scoreScientific, scoreOriginality, scorePresentation, comments
    ]);
    return rows[0];
  }

  /**
   * Obtiene el reporte del sistema para un envío dado.
   * @returns {Object|null} El reporte o null si no existe
   */
  async findByEnvioId(envioId) {
    const query = `
      SELECT id, envio_id, score_scientific, score_originality, score_presentation, comments, created_at
      FROM revisiones_sistema
      WHERE envio_id = $1
      LIMIT 1
    `;
    const { rows } = await db.query(query, [envioId]);
    return rows[0] || null;
  }
}

module.exports = new RevisionesRepository();
