const db = require('./db');

async function migrate() {
  console.log('Iniciando migración para agregar "linea_investigacion" y "nivel_academico" a la tabla envios_ojs...');
  try {
    // 1. Agregar columna linea_investigacion si no existe
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE envios_ojs ADD COLUMN IF NOT EXISTS linea_investigacion VARCHAR(255);', [], function(err) {
        if (err) return reject(err);
        resolve();
      });
    });
    console.log('✅ Columna "linea_investigacion" agregada con éxito (o ya existía).');

    // 2. Agregar columna nivel_academico si no existe
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE envios_ojs ADD COLUMN IF NOT EXISTS nivel_academico VARCHAR(100);', [], function(err) {
        if (err) return reject(err);
        resolve();
      });
    });
    console.log('✅ Columna "nivel_academico" agregada con éxito (o ya existía).');

    // 3. Migrar datos existentes desde la tabla de congresos
    console.log('🔄 Migrando datos existentes de congresos a envios_ojs...');
    await new Promise((resolve, reject) => {
      const updateQuery = `
        UPDATE envios_ojs e
        SET 
          linea_investigacion = COALESCE(e.linea_investigacion, c.linea_investigacion),
          nivel_academico = COALESCE(e.nivel_academico, c.nivel_academico)
        FROM congresos c
        WHERE e.congreso_id = c.id;
      `;
      db.run(updateQuery, [], function(err) {
        if (err) return reject(err);
        // db.run context this.changes has rowCount
        console.log(`✅ Registros actualizados/migrados exitosamente.`);
        resolve();
      });
    });
    
  } catch (err) {
    console.error('❌ Error durante la migración:', err.message);
  }
  process.exit(0);
}

migrate();
