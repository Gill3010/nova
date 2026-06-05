const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// 1. Configuración de SQLite (Crea el archivo database.sqlite automáticamente)
const dbPath = path.resolve(__dirname, 'nova.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos SQLite:', err.message);
  } else {
    console.log(`Conectado exitosamente a la base de datos SQLite en: ${dbPath}`);
    initDB();
  }
});

// 2. Crear las tablas si no existen
const initDB = () => {
  db.serialize(() => {
    // Tabla: congresos
    db.run(`
      CREATE TABLE IF NOT EXISTS congresos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          descripcion TEXT,
          fecha_celebracion TEXT,
          sede TEXT,
          modalidad TEXT,
          nivel_academico TEXT,
          linea_investigacion TEXT,
          aula_canal TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla: envios_ojs
    db.run(`
      CREATE TABLE IF NOT EXISTS envios_ojs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          congreso_id INTEGER,
          ojs_submission_id INTEGER NOT NULL,
          ojs_publication_id INTEGER,
          titulo_articulo TEXT,
          palabras_claves TEXT,
          colaboradores TEXT,
          revista_destino TEXT,
          categoria TEXT,
          autor_email TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (congreso_id) REFERENCES congresos (id) ON DELETE CASCADE
      )
    `);
    
    console.log('Tablas inicializadas correctamente (o ya existían).');
  });
};

// Endpoint de prueba
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Pong! Servidor Node.js con SQLite funcionando correctamente.' });
});

// Guardar o registrar un Congreso
app.post('/api/congresos', (req, res) => {
  const {
    nombre,
    descripcion,
    fecha_celebracion,
    sede,
    modalidad,
    nivel_academico,
    linea_investigacion,
    aula_canal
  } = req.body;

  const query = `
    INSERT INTO congresos 
      (nombre, descripcion, fecha_celebracion, sede, modalidad, nivel_academico, linea_investigacion, aula_canal) 
    VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [nombre, descripcion, fecha_celebracion, sede, modalidad, nivel_academico, linea_investigacion, aula_canal];
  
  db.run(query, values, function(err) {
    if (err) {
      console.error('Error al guardar el congreso:', err.message);
      res.status(500).json({ success: false, error: 'Error interno del servidor al guardar el congreso' });
      return;
    }
    // "this" reference has the lastID in sqlite3 db.run callback
    const insertedId = this.lastID;
    db.get(`SELECT * FROM congresos WHERE id = ?`, [insertedId], (err, row) => {
      if (err) {
        res.status(500).json({ success: false, error: 'Congreso guardado pero hubo error al recuperarlo' });
        return;
      }
      res.status(201).json({ success: true, congreso: row });
    });
  });
});

// Registrar un envío de OJS relacionado a un Congreso
app.post('/api/envios', (req, res) => {
  const { 
    congreso_id, ojs_submission_id, ojs_publication_id, 
    categoria, autor_email, titulo_articulo, palabras_claves, colaboradores, revista_destino 
  } = req.body;

  if (!congreso_id || !ojs_submission_id) {
    return res.status(400).json({ success: false, error: 'congreso_id y ojs_submission_id son requeridos' });
  }

  const query = `
    INSERT INTO envios_ojs 
      (congreso_id, ojs_submission_id, ojs_publication_id, categoria, autor_email, titulo_articulo, palabras_claves, colaboradores, revista_destino) 
    VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [congreso_id, ojs_submission_id, ojs_publication_id, categoria, autor_email, titulo_articulo, palabras_claves, colaboradores, revista_destino];
  
  db.run(query, values, function(err) {
    if (err) {
      console.error('Error al registrar el envío OJS:', err.message);
      res.status(500).json({ success: false, error: 'Error interno del servidor al registrar el envío' });
      return;
    }
    const insertedId = this.lastID;
    db.get(`SELECT * FROM envios_ojs WHERE id = ?`, [insertedId], (err, row) => {
      res.status(201).json({ success: true, envio: row });
    });
  });
});

// Obtener todos los congresos con sus envíos (Para el Dashboard)
app.get('/api/congresos', (req, res) => {
  const query = `
    SELECT 
      c.*,
      COALESCE(
        (
          SELECT json_group_array(
            json_object(
              'id', e.id,
              'ojs_submission_id', e.ojs_submission_id,
              'titulo_articulo', e.titulo_articulo,
              'palabras_claves', e.palabras_claves,
              'colaboradores', e.colaboradores,
              'revista_destino', e.revista_destino,
              'categoria', e.categoria,
              'autor_email', e.autor_email,
              'created_at', e.created_at
            )
          )
          FROM envios_ojs e WHERE e.congreso_id = c.id
        ),
        '[]'
      ) as envios
    FROM congresos c
    ORDER BY c.created_at DESC;
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error al obtener los datos del dashboard:', err.message);
      res.status(500).json({ success: false, error: 'Error interno al consultar la base de datos SQLite' });
      return;
    }
    
    // SQLite devuelve el string JSON para envios, así que lo parseamos para enviarlo correctamente en el res.json
    const formattedRows = rows.map(row => {
      let enviosArray = [];
      try {
        if (row.envios && row.envios !== '[]') {
          // json_group_array de SQLite a veces incluye nulls si no hay registros correspondientes, lo limpiamos
          const parsed = JSON.parse(row.envios);
          enviosArray = parsed.filter(e => e.id !== null);
        }
      } catch (e) {
        console.warn("No se pudo parsear los envíos JSON:", e);
      }
      return { ...row, envios: enviosArray };
    });

    res.status(200).json({ success: true, data: formattedRows });
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor de Nova con SQLite corriendo en http://localhost:${port}`);
});
