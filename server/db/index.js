const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../nova.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(JSON.stringify({ level: 'error', message: `Error al abrir la base de datos SQLite: ${err.message}` }));
  } else {
    console.log(JSON.stringify({ level: 'info', message: `Conectado exitosamente a la base de datos SQLite en: ${dbPath}` }));
    initDB();
  }
});

const initDB = () => {
  db.serialize(() => {
    // Tabla: usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          rol TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla: congresos
    db.run(`
      CREATE TABLE IF NOT EXISTS congresos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          creador_id INTEGER,
          nombre TEXT NOT NULL,
          descripcion TEXT,
          fecha_celebracion TEXT,
          sede TEXT,
          modalidad TEXT,
          nivel_academico TEXT,
          linea_investigacion TEXT,
          aula_canal TEXT,
          ojs_url TEXT,
          ojs_api_key TEXT,
          ojs_journal_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (creador_id) REFERENCES usuarios (id) ON DELETE SET NULL
      )
    `);

    // Ejecutar migraciones para agregar columnas si la base de datos ya existía
    db.run("ALTER TABLE congresos ADD COLUMN ojs_url TEXT", (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error(JSON.stringify({ level: 'error', message: `Error agregando ojs_url: ${err.message}` }));
      }
    });
    db.run("ALTER TABLE congresos ADD COLUMN ojs_api_key TEXT", (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error(JSON.stringify({ level: 'error', message: `Error agregando ojs_api_key: ${err.message}` }));
      }
    });
    db.run("ALTER TABLE congresos ADD COLUMN ojs_journal_path TEXT", (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error(JSON.stringify({ level: 'error', message: `Error agregando ojs_journal_path: ${err.message}` }));
      }
    });

    // Tabla: envios_ojs
    db.run(`
      CREATE TABLE IF NOT EXISTS envios_ojs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          congreso_id INTEGER,
          usuario_id INTEGER,
          ojs_submission_id INTEGER NOT NULL,
          ojs_publication_id INTEGER,
          titulo_articulo TEXT,
          palabras_claves TEXT,
          colaboradores TEXT,
          revista_destino TEXT,
          categoria TEXT,
          autor_email TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (congreso_id) REFERENCES congresos (id) ON DELETE CASCADE,
          FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
      )
    `);
    
    console.log(JSON.stringify({ level: 'info', message: 'Tablas inicializadas correctamente (o ya existían).' }));
  });
};

module.exports = db;
