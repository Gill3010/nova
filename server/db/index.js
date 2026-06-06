const { Pool } = require('pg');
const logger = require('../utils/logger');
require('dotenv').config();

// Determine database user: use DB_USER from env, or the current system user as default for local Homebrew Postgres
const dbUser = process.env.DB_USER || process.env.USER || 'postgres';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: dbUser,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'nova_db',
  port: parseInt(process.env.DB_PORT || '5432', 10)
});

pool.connect((err, client, release) => {
  if (err) {
    logger.error('Error conectando a PostgreSQL:', { error: err.message });
  } else {
    logger.info('Conectado exitosamente a la base de datos PostgreSQL local.');
    release();
  }
});

// Adaptador para replicar la API de sqlite3 pero ejecutando en PostgreSQL
const db = {
  // Ejecuta una consulta simple
  query: (text, params, callback) => {
    return pool.query(text, params, callback);
  },
  
  // Equivale a db.all en SQLite (retorna un arreglo de filas)
  all: (text, params, callback) => {
    pool.query(text, params, (err, res) => {
      callback(err, res ? res.rows : null);
    });
  },
  
  // Equivale a db.get en SQLite (retorna solo la primera fila)
  get: (text, params, callback) => {
    pool.query(text, params, (err, res) => {
      callback(err, res ? res.rows[0] : null);
    });
  },
  
  // Equivale a db.run en SQLite
  run: function (text, params, callback) {
    let queryText = text;
    const isInsert = text.trim().toUpperCase().startsWith('INSERT');
    
    // Auto-agregar RETURNING id si es un INSERT para imitar el this.lastID
    if (isInsert && !text.toUpperCase().includes('RETURNING')) {
      queryText += ' RETURNING id';
    }

    pool.query(queryText, params, function (err, res) {
      if (err) {
        return callback(err);
      }
      
      const context = {
        lastID: isInsert && res.rows && res.rows.length > 0 ? res.rows[0].id : null,
        changes: res ? res.rowCount : 0
      };
      
      // Llamamos al callback simulando el contexto `this` de SQLite
      if (callback) {
        callback.call(context, null);
      }
    });
  }
};

module.exports = db;
