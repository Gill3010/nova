const db = require('./db');

async function migrate() {
  console.log('Iniciando migración para agregar la columna "resumen" a la tabla envios_ojs...');
  try {
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE envios_ojs ADD COLUMN IF NOT EXISTS resumen TEXT;', [], function(err) {
        if (err) return reject(err);
        resolve();
      });
    });
    console.log('✅ Columna "resumen" agregada con éxito (o ya existía).');
  } catch (err) {
    console.error('❌ Error al agregar la columna:', err.message);
  }
  process.exit(0);
}

migrate();
