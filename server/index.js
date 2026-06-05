const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'nova_super_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'No se proporcionó un token de seguridad' });
  
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Token con formato inválido' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token expirado o inválido' });
    req.user = decoded; // { id, rol, email }
    next();
  });
};

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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (creador_id) REFERENCES usuarios (id) ON DELETE SET NULL
      )
    `);

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
    
    console.log('Tablas inicializadas correctamente (o ya existían).');
  });
};

// Endpoint de prueba
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Pong! Servidor Node.js con SQLite funcionando correctamente.' });
});

// --- AUTENTICACIÓN ---

app.post('/api/auth/register', async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  console.log('Recibida petición de registro:', { nombre, email, rol });
  
  if (!nombre || !email || !password || !rol) {
    console.log('Error: Faltan campos');
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const saltRounds = 10;
    console.log('Iniciando encriptación de contraseña...');
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('Contraseña encriptada exitosamente.');

    const query = `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)`;
    db.run(query, [nombre, email, passwordHash, rol], function (err) {
      if (err) {
        console.error('Error insertando en base de datos:', err.message);
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'El email ya está registrado' });
        }
        return res.status(500).json({ error: 'Error interno al registrar usuario' });
      }
      console.log('Usuario registrado con ID:', this.lastID);
      res.status(201).json({ success: true, userId: this.lastID });
    });
  } catch (error) {
    console.error('Error procesando contraseña:', error);
    res.status(500).json({ error: 'Error al procesar la contraseña' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const query = `SELECT * FROM usuarios WHERE email = ?`;
  db.get(query, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Error interno del servidor' });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Credenciales inválidas' });

    const payload = { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.json({ success: true, token, user: payload });
  });
});

// --- FUNCIONALIDADES PROTEGIDAS ---

// Guardar o registrar un Congreso
app.post('/api/congresos', verifyToken, (req, res) => {
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
  const creador_id = req.user.id;

  const query = `
    INSERT INTO congresos 
      (creador_id, nombre, descripcion, fecha_celebracion, sede, modalidad, nivel_academico, linea_investigacion, aula_canal) 
    VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [creador_id, nombre, descripcion, fecha_celebracion, sede, modalidad, nivel_academico, linea_investigacion, aula_canal];
  
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
app.post('/api/envios', verifyToken, (req, res) => {
  const { 
    congreso_id, ojs_submission_id, ojs_publication_id, 
    categoria, autor_email, titulo_articulo, palabras_claves, colaboradores, revista_destino 
  } = req.body;
  const usuario_id = req.user.id;

  if (!congreso_id || !ojs_submission_id) {
    return res.status(400).json({ success: false, error: 'congreso_id y ojs_submission_id son requeridos' });
  }

  const query = `
    INSERT INTO envios_ojs 
      (congreso_id, usuario_id, ojs_submission_id, ojs_publication_id, categoria, autor_email, titulo_articulo, palabras_claves, colaboradores, revista_destino) 
    VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [congreso_id, usuario_id, ojs_submission_id, ojs_publication_id, categoria, autor_email, titulo_articulo, palabras_claves, colaboradores, revista_destino];
  
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

// Actualizar un congreso existente
app.put('/api/congresos/:id', verifyToken, (req, res) => {
  const congressId = req.params.id;
  const {
    nombre, descripcion, fecha_celebracion, sede, modalidad,
    nivel_academico, linea_investigacion, aula_canal
  } = req.body;
  const userId = req.user.id;
  const rol = req.user.rol;

  let query = `
    UPDATE congresos 
    SET nombre = ?, descripcion = ?, fecha_celebracion = ?, sede = ?, 
        modalidad = ?, nivel_academico = ?, linea_investigacion = ?, aula_canal = ?
    WHERE id = ?
  `;
  let values = [nombre, descripcion, fecha_celebracion, sede, modalidad, nivel_academico, linea_investigacion, aula_canal, congressId];

  if (rol !== 'admin') {
    query += ` AND creador_id = ?`;
    values.push(userId);
  }

  db.run(query, values, function(err) {
    if (err) {
      console.error('Error al actualizar congreso:', err.message);
      return res.status(500).json({ success: false, error: 'Error interno del servidor al actualizar' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: 'Congreso no encontrado o no autorizado' });
    }
    res.json({ success: true, message: 'Congreso actualizado exitosamente' });
  });
});

// Actualizar un envío existente
app.put('/api/envios/:id', verifyToken, (req, res) => {
  const envioId = req.params.id;
  const { titulo_articulo, palabras_claves, colaboradores, categoria, congreso_id } = req.body;
  const userId = req.user.id;
  const rol = req.user.rol;
  
  console.log('Update Envio Payload:', req.body);

  let query = `
    UPDATE envios_ojs
    SET titulo_articulo = ?, palabras_claves = ?, colaboradores = ?, categoria = ?
  `;
  let values = [titulo_articulo, palabras_claves, colaboradores, categoria];

  if (congreso_id) {
    query += `, congreso_id = ?`;
    values.push(congreso_id);
  }

  query += ` WHERE id = ?`;
  values.push(envioId);

  if (rol !== 'admin') {
    query += ` AND usuario_id = ?`;
    values.push(userId);
  }

  db.run(query, values, function(err) {
    if (err) {
      console.error('Error al actualizar envío:', err.message);
      return res.status(500).json({ success: false, error: 'Error interno del servidor al actualizar envío' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: 'Envío no encontrado o no autorizado' });
    }
    res.json({ success: true, message: 'Envío actualizado exitosamente' });
  });
});

// Obtener los envíos del usuario actual
app.get('/api/envios/me', verifyToken, (req, res) => {
  const usuario_id = req.user.id;
  const query = `
    SELECT 
      e.id,
      e.ojs_submission_id,
      e.titulo_articulo,
      e.palabras_claves,
      e.colaboradores,
      e.categoria,
      e.created_at,
      e.congreso_id,
      c.nombre AS congreso_nombre
    FROM envios_ojs e
    JOIN congresos c ON e.congreso_id = c.id
    WHERE e.usuario_id = ?
    ORDER BY e.created_at DESC
  `;

  db.all(query, [usuario_id], (err, rows) => {
    if (err) {
      console.error('Error al obtener los envíos del usuario:', err.message);
      return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
    res.status(200).json({ success: true, data: rows });
  });
});

// Obtener todos los congresos con sus envíos (Para el Dashboard y Listados)
app.get('/api/congresos', verifyToken, (req, res) => {
  const { rol, id } = req.user;
  const scope = req.query.scope; // 'all' o 'mine'
  
  let whereClause = '';
  let queryParams = [];

  // Si NO es admin, y (solicita 'mine' o es organizador pidiendo por defecto)
  if (rol !== 'admin' && (scope === 'mine' || (rol === 'organizer' && scope !== 'all'))) {
    whereClause = 'WHERE c.creador_id = ?';
    queryParams.push(id);
  }

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
    ${whereClause}
    ORDER BY c.created_at DESC;
  `;
  
  db.all(query, queryParams, (err, rows) => {
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
