const db = require('./db');

const query = `
  INSERT INTO congresos 
    (creador_id, nombre, lema, descripcion, fecha_celebracion, fecha_finalizacion, sede, modalidad, nivel_academico, linea_investigacion, aula_canal, ojs_url, ojs_api_key, ojs_journal_path, ojs_submission_id, ojs_publication_id, espacio_id) 
  VALUES 
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
`;

const values = [
  null,
  'Congreso de Prueba',
  'Lema',
  'Descripcion',
  '2026-06-10',
  null,
  'Sede',
  'híbrida',
  'nivel',
  'linea',
  'aula',
  'url',
  'key',
  'path',
  null,
  null,
  null
];

db.run(query, values, function(err) {
  if (err) {
    console.error('ERROR SQL:', err);
  } else {
    console.log('INSERT SUCCESS. ID:', this.lastID);
  }
  process.exit();
});
