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

module.exports = pool;
