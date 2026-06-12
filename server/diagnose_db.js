// server/diagnose_db.js
require('dotenv').config();
const db = require('./db');

async function run() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE BASE DE DATOS...\n');

  try {
    // 1. Usuarios
    const users = await db.query('SELECT id, nombre, email, rol FROM usuarios');
    console.log('=== USUARIOS EN BD ===');
    console.table(users.rows || []);

    // 2. Congresos
    const congresses = await db.query('SELECT id, nombre, creador_id, ojs_journal_path FROM congresos');
    console.log('\n=== CONGRESOS EN BD ===');
    console.table(congresses.rows || []);

    // 3. Envíos
    const envios = await db.query('SELECT id, congreso_id, usuario_id, titulo_articulo, revista_destino FROM envios_ojs');
    console.log('\n=== ENVÍOS EN BD ===');
    console.table(envios.rows || []);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando diagnóstico:', error);
    process.exit(1);
  }
}

run();
