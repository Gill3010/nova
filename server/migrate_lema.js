const { Pool } = require('pg');
require('dotenv').config();

const dbUser = process.env.DB_USER || process.env.USER || 'postgres';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: dbUser,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'nova_db',
  port: parseInt(process.env.DB_PORT || '5432', 10)
});

async function migrate() {
  try {
    console.log('Conectando a la base de datos...');
    await pool.query(`
      ALTER TABLE congresos ADD COLUMN IF NOT EXISTS lema VARCHAR(500);
    `);
    console.log('✅ Columna "lema" agregada exitosamente a la tabla congresos (o ya existía).');
  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
  } finally {
    pool.end();
  }
}

migrate();
