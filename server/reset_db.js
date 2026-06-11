const fs = require('fs');
const path = require('path');
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

async function resetDB() {
  try {
    console.log('Conectando a la base de datos...');
    
    // Eliminar todas las tablas
    console.log('Eliminando tablas existentes (CASCADE)...');
    await pool.query(`
      DROP TABLE IF EXISTS congreso_portal_ojs CASCADE;
      DROP TABLE IF EXISTS revistas_ojs CASCADE;
      DROP TABLE IF EXISTS portales_ojs CASCADE;
      DROP TABLE IF EXISTS actividades CASCADE;
      DROP TABLE IF EXISTS congreso_sedes CASCADE;
      DROP TABLE IF EXISTS envios_ojs CASCADE;
      DROP TABLE IF EXISTS congresos CASCADE;
      DROP TABLE IF EXISTS espacios CASCADE;
      DROP TABLE IF EXISTS usuarios CASCADE;
    `);
    
    // Leer el archivo database.sql
    console.log('Leyendo archivo de estructura (database.sql)...');
    const sqlPath = path.join(__dirname, 'database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar el script para crear las tablas
    console.log('Creando tablas nuevas...');
    await pool.query(sql);
    
    console.log('¡Base de datos reiniciada con éxito!');
    console.log('Todas las tablas han sido vaciadas y creadas desde cero.');
  } catch (error) {
    console.error('Error al reiniciar la base de datos:', error);
  } finally {
    pool.end();
  }
}

resetDB();
