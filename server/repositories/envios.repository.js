const db = require('../db');

class EnviosRepository {
  findByUserId(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          e.id, e.ojs_submission_id, e.ojs_publication_id, e.titulo_articulo,
          e.resumen, e.palabras_claves, e.colaboradores, e.categoria,
          e.nivel_academico, e.linea_investigacion,
          e.created_at, e.congreso_id, e.revista_ojs_id, e.revista_destino,
          c.nombre AS congreso_nombre, r.nombre AS revista_nombre,
          r.ojs_journal_path AS revista_path, p.ojs_url AS portal_url,
          p.ojs_api_key AS portal_api_key
        FROM envios_ojs e
        JOIN congresos c ON e.congreso_id = c.id
        LEFT JOIN revistas_ojs r ON e.revista_ojs_id = r.id
        LEFT JOIN portales_ojs p ON r.portal_ojs_id = p.id
        WHERE e.usuario_id = $1
        ORDER BY e.created_at DESC
      `;
      db.all(query, [userId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  create(envioData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO envios_ojs 
          (congreso_id, usuario_id, ojs_submission_id, ojs_publication_id, categoria, autor_email, titulo_articulo, resumen, palabras_claves, colaboradores, revista_destino, revista_ojs_id, nivel_academico, linea_investigacion) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `;
      const values = [
        envioData.congreso_id, envioData.usuario_id, envioData.ojs_submission_id,
        envioData.ojs_publication_id || null, envioData.categoria,
        envioData.autor_email ? envioData.autor_email.trim().toLowerCase() : null,
        envioData.titulo_articulo.trim(), envioData.resumen ? envioData.resumen.trim() : null,
        envioData.palabras_claves ? envioData.palabras_claves.trim() : null,
        envioData.colaboradores, envioData.revista_destino ? envioData.revista_destino.trim() : null,
        envioData.revista_ojs_id || null,
        envioData.nivel_academico ? envioData.nivel_academico.trim() : null,
        envioData.linea_investigacion ? envioData.linea_investigacion.trim() : null
      ];
      
      db.run(query, values, function(err) {
        if (err) return reject(err);
        const insertedId = this.lastID;
        db.get(`SELECT * FROM envios_ojs WHERE id = $1`, [insertedId], (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });
    });
  }

  update(id, userId, rol, updates) {
    return new Promise((resolve, reject) => {
      const updateFields = [];
      const values = [];
      let counter = 1;

      // Map dynamic updates to SQL placeholders
      const allowedFields = [
        'titulo_articulo', 'resumen', 'palabras_claves', 
        'colaboradores', 'categoria', 'congreso_id', 
        'ojs_submission_id', 'ojs_publication_id', 'revista_ojs_id',
        'revista_destino', 'nivel_academico', 'linea_investigacion'
      ];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = $${counter++}`);
          values.push(value !== undefined ? value : null);
        }
      }

      if (updateFields.length === 0) {
        return resolve({ changes: 0 }); // Nothing to update
      }

      let query = `UPDATE envios_ojs SET ${updateFields.join(', ')} WHERE id = $${counter++}`;
      values.push(id);

      // Only restrict by user if not an admin
      if (rol !== 'admin') {
        query += ` AND usuario_id = $${counter++}`;
        values.push(userId);
      }

      db.run(query, values, function(err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = new EnviosRepository();
