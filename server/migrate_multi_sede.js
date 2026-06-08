const path = require('path');
const { Pool } = require('pg');
const logger = require('./utils/logger');
// Cargar .env desde el directorio del script, no desde el CWD
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Use the Pool directly to ensure proper async/await support
const dbUser = process.env.DB_USER || process.env.USER || 'postgres';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: dbUser,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'nova_db',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function migrate() {
  logger.info('Iniciando migración para arquitectura Multi-Sede y Actividades...');

  let client;
  try {
    client = await pool.connect();
    logger.info('Conexión a la base de datos establecida.');

    // Verificar y añadir creador_id a la tabla espacios si no existe
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='espacios' AND column_name='creador_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      logger.info('Añadiendo columna creador_id a la tabla espacios...');
      await client.query(`
        ALTER TABLE espacios 
        ADD COLUMN creador_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL
      `);
      logger.info('Columna creador_id añadida con éxito.');
    } else {
      logger.info('La columna creador_id ya existe en la tabla espacios.');
    }

    // 1. Crear tabla congreso_sedes
    await client.query(`
      CREATE TABLE IF NOT EXISTS congreso_sedes (
          congreso_id INTEGER REFERENCES congresos(id) ON DELETE CASCADE,
          espacio_id INTEGER REFERENCES espacios(id) ON DELETE CASCADE,
          es_sede_principal BOOLEAN DEFAULT FALSE,
          PRIMARY KEY (congreso_id, espacio_id)
      )
    `);
    logger.info('Tabla congreso_sedes creada/verificada correctamente.');

    // 2. Crear tabla actividades
    await client.query(`
      CREATE TABLE IF NOT EXISTS actividades (
          id SERIAL PRIMARY KEY,
          congreso_id INTEGER REFERENCES congresos(id) ON DELETE CASCADE,
          espacio_id INTEGER REFERENCES espacios(id) ON DELETE SET NULL,
          titulo VARCHAR(255) NOT NULL,
          descripcion TEXT,
          fecha VARCHAR(100),
          hora_inicio VARCHAR(10),
          hora_fin VARCHAR(10),
          enlace_virtual TEXT,
          estado VARCHAR(50) DEFAULT 'Programada',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('Tabla actividades creada/verificada correctamente.');

    // 3. Migrar datos existentes (Si un congreso tiene espacio_id, insertarlo en congreso_sedes)
    const result = await client.query('SELECT id, espacio_id FROM congresos WHERE espacio_id IS NOT NULL');
    const congresos = result.rows;

    if (congresos.length > 0) {
      let migradas = 0;
      for (const cong of congresos) {
        try {
          await client.query(
            `INSERT INTO congreso_sedes (congreso_id, espacio_id, es_sede_principal)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [cong.id, cong.espacio_id, true]
          );
          migradas++;
        } catch (e) {
          logger.warn(`No se pudo migrar la sede para congreso ${cong.id}: ${e.message}`);
        }
      }
      logger.info(`Se migraron exitosamente ${migradas} asociaciones de sedes principales.`);
    } else {
      logger.info('No hay congresos existentes que requieran migración de sedes.');
    }

    logger.info('¡Migración completada exitosamente!');
  } catch (err) {
    logger.error('Error crítico durante la migración:', { message: err.message, detail: err.detail });
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
    process.exit(0);
  }
}

migrate();
