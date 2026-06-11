/**
 * Migración: Mover la relación Revista OJS de Congreso a Envío de Ponencia
 * 
 * Este script crea las nuevas tablas normalizadas para portales y revistas OJS,
 * migra los datos existentes desde la tabla congresos, y establece las relaciones
 * correctas entre congresos, portales OJS, revistas y envíos.
 * 
 * Uso: node migrate_revista_ojs.js
 */
require('dotenv').config();
const db = require('./db');

async function migrate() {
  console.log('🚀 Iniciando migración: Revista OJS → Envío de Ponencia...\n');

  try {
    // ──────────────────────────────────────────────────
    // 1. Crear tabla portales_ojs (credenciales del portal)
    // ──────────────────────────────────────────────────
    console.log('📦 Creando tabla portales_ojs...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS portales_ojs (
        id SERIAL PRIMARY KEY,
        ojs_url TEXT NOT NULL,
        ojs_api_key TEXT NOT NULL,
        nombre VARCHAR(255),
        habilitado BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ojs_url)
      );
    `);
    console.log('   ✅ Tabla portales_ojs creada.\n');

    // ──────────────────────────────────────────────────
    // 2. Crear tabla revistas_ojs (revistas dentro de un portal)
    // ──────────────────────────────────────────────────
    console.log('📦 Creando tabla revistas_ojs...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS revistas_ojs (
        id SERIAL PRIMARY KEY,
        portal_ojs_id INTEGER NOT NULL REFERENCES portales_ojs(id) ON DELETE CASCADE,
        ojs_journal_path VARCHAR(255) NOT NULL,
        ojs_journal_id INTEGER,
        nombre VARCHAR(255),
        url TEXT,
        habilitada BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(portal_ojs_id, ojs_journal_path)
      );
    `);
    console.log('   ✅ Tabla revistas_ojs creada.\n');

    // ──────────────────────────────────────────────────
    // 3. Crear tabla congreso_portal_ojs (relación congreso ↔ portal)
    // ──────────────────────────────────────────────────
    console.log('📦 Creando tabla congreso_portal_ojs...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS congreso_portal_ojs (
        congreso_id INTEGER NOT NULL REFERENCES congresos(id) ON DELETE CASCADE,
        portal_ojs_id INTEGER NOT NULL REFERENCES portales_ojs(id) ON DELETE CASCADE,
        PRIMARY KEY (congreso_id, portal_ojs_id)
      );
    `);
    console.log('   ✅ Tabla congreso_portal_ojs creada.\n');

    // ──────────────────────────────────────────────────
    // 4. Agregar columna revista_ojs_id a envios_ojs (nullable)
    // ──────────────────────────────────────────────────
    console.log('📦 Agregando columna revista_ojs_id a envios_ojs...');
    try {
      await db.query(`
        ALTER TABLE envios_ojs 
        ADD COLUMN IF NOT EXISTS revista_ojs_id INTEGER REFERENCES revistas_ojs(id) ON DELETE SET NULL;
      `);
      console.log('   ✅ Columna revista_ojs_id agregada a envios_ojs.\n');
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        console.log('   ⚠️  Columna revista_ojs_id ya existe en envios_ojs.\n');
      } else {
        throw err;
      }
    }

    // ──────────────────────────────────────────────────
    // 5. Migrar datos existentes
    // ──────────────────────────────────────────────────
    console.log('🔄 Migrando datos existentes desde congresos...');

    // 5a. Insertar portales únicos desde congresos existentes
    const portalResult = await db.query(`
      INSERT INTO portales_ojs (ojs_url, ojs_api_key, nombre)
      SELECT DISTINCT ojs_url, ojs_api_key, ojs_url
      FROM congresos
      WHERE ojs_url IS NOT NULL AND ojs_url != '' AND ojs_api_key IS NOT NULL AND ojs_api_key != ''
      ON CONFLICT (ojs_url) DO NOTHING
      RETURNING id, ojs_url;
    `);
    const portalesCreados = portalResult.rows ? portalResult.rows.length : 0;
    console.log(`   📌 ${portalesCreados} portal(es) OJS migrado(s).`);

    // 5b. Insertar revistas desde congresos existentes
    const revistaResult = await db.query(`
      INSERT INTO revistas_ojs (portal_ojs_id, ojs_journal_path, nombre)
      SELECT DISTINCT p.id, c.ojs_journal_path, c.ojs_journal_path
      FROM congresos c
      JOIN portales_ojs p ON p.ojs_url = c.ojs_url
      WHERE c.ojs_journal_path IS NOT NULL AND c.ojs_journal_path != ''
      ON CONFLICT (portal_ojs_id, ojs_journal_path) DO NOTHING
      RETURNING id, ojs_journal_path;
    `);
    const revistasCreadas = revistaResult.rows ? revistaResult.rows.length : 0;
    console.log(`   📌 ${revistasCreadas} revista(s) OJS migrada(s).`);

    // 5c. Crear relaciones congreso ↔ portal
    const relResult = await db.query(`
      INSERT INTO congreso_portal_ojs (congreso_id, portal_ojs_id)
      SELECT DISTINCT c.id, p.id
      FROM congresos c
      JOIN portales_ojs p ON p.ojs_url = c.ojs_url
      WHERE c.ojs_url IS NOT NULL AND c.ojs_url != ''
      ON CONFLICT DO NOTHING
      RETURNING congreso_id;
    `);
    const relacionesCreadas = relResult.rows ? relResult.rows.length : 0;
    console.log(`   📌 ${relacionesCreadas} relación(es) congreso↔portal creada(s).`);

    // 5d. Backfill: asignar revista_ojs_id a envíos existentes
    const backfillResult = await db.query(`
      UPDATE envios_ojs e
      SET revista_ojs_id = (
        SELECT r.id
        FROM congresos c
        JOIN portales_ojs p ON p.ojs_url = c.ojs_url
        JOIN revistas_ojs r ON r.portal_ojs_id = p.id AND r.ojs_journal_path = c.ojs_journal_path
        WHERE c.id = e.congreso_id
        LIMIT 1
      )
      WHERE e.revista_ojs_id IS NULL
        AND EXISTS (
          SELECT 1 FROM congresos c
          JOIN portales_ojs p ON p.ojs_url = c.ojs_url
          JOIN revistas_ojs r ON r.portal_ojs_id = p.id AND r.ojs_journal_path = c.ojs_journal_path
          WHERE c.id = e.congreso_id
        );
    `);
    const enviosActualizados = backfillResult.rowCount || 0;
    console.log(`   📌 ${enviosActualizados} envío(s) actualizado(s) con revista_ojs_id.\n`);

    // ──────────────────────────────────────────────────
    // 6. Resumen
    // ──────────────────────────────────────────────────
    console.log('✅ Migración completada exitosamente.');
    console.log('');
    console.log('📊 Resumen:');
    console.log(`   • Portales OJS creados: ${portalesCreados}`);
    console.log(`   • Revistas OJS creadas: ${revistasCreadas}`);
    console.log(`   • Relaciones congreso↔portal: ${relacionesCreadas}`);
    console.log(`   • Envíos actualizados (backfill): ${enviosActualizados}`);
    console.log('');
    console.log('⚠️  NOTA: Las columnas ojs_url, ojs_api_key, ojs_journal_path en');
    console.log('   la tabla congresos NO se eliminan en esta fase (retrocompatibilidad).');
    console.log('   Se eliminarán en una migración futura cuando se confirme estabilidad.');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrate();
