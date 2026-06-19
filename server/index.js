require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PORT, ALLOWED_ORIGINS } = require('./config');
const logger = require('./utils/logger');

// Inicializar base de datos
const db = require('./db');

// Asegurar que las tablas de revisores existan en la BD
const initDbSchema = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS revisores_envios (
        revisor_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        envio_id INTEGER REFERENCES envios_ojs(id) ON DELETE CASCADE,
        PRIMARY KEY (revisor_id, envio_id)
      );
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS evaluaciones (
        id SERIAL PRIMARY KEY,
        envio_id INTEGER REFERENCES envios_ojs(id) ON DELETE CASCADE,
        revisor_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        score_scientific INTEGER,
        score_originality INTEGER,
        score_presentation INTEGER,
        comments TEXT,
        approved BOOLEAN,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(envio_id, revisor_id)
      );
    `);
    // Columna para la clave del archivo en S3/local
    await db.query(`ALTER TABLE envios_ojs ADD COLUMN IF NOT EXISTS archivo_key VARCHAR(500);`);
    // Tabla de revisiones del sistema (generadas por Lambda/IA)
    await db.query(`
      CREATE TABLE IF NOT EXISTS revisiones_sistema (
        id SERIAL PRIMARY KEY,
        envio_id INTEGER REFERENCES envios_ojs(id) ON DELETE CASCADE UNIQUE,
        score_scientific INTEGER,
        score_originality INTEGER,
        score_presentation INTEGER,
        comments TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info('Esquemas de revisores y evaluaciones verificados/creados en la base de datos.');
  } catch (err) {
    logger.error('Error al inicializar esquemas en base de datos:', { error: err.message });
  }
};
initDbSchema();

const app = express();

// Configuración restringida de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como apps móviles o curl/postman)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`Petición CORS bloqueada de origen no autorizado`, { origin });
      callback(new Error('No permitido por la configuración de CORS de Nova'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Importar rutas de proxy ANTES de express.json() para evitar consumir el stream de subidas y POSTs
const ojsProxyRoutes = require('./routes/ojsProxy');
app.use('/api/ojs-proxy', ojsProxyRoutes);

app.use(express.json());

// Middleware de registro de peticiones (Logging estructurado)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`Petición HTTP procesada`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip
    });
  });
  next();
});

// Importar rutas
const authRoutes = require('./routes/auth');
const congresosRoutes = require('./routes/congresos');
const enviosRoutes = require('./routes/envios');
const usuariosRoutes = require('./routes/usuarios');
const espaciosRoutes = require('./routes/espacios');
const actividadesRoutes = require('./routes/actividades');
const portalesOjsRoutes = require('./routes/portalesOjs');
const revisionesRoutes = require('./routes/revisiones');

// Registrar rutas
app.use('/api/auth', authRoutes);
app.use('/api/congresos', congresosRoutes);
app.use('/api/envios', enviosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/espacios', espaciosRoutes);
app.use('/api/actividades', actividadesRoutes);
app.use('/api/portales-ojs', portalesOjsRoutes);
app.use('/api/revisiones', revisionesRoutes);

// Endpoint de salud
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Pong! Servidor modular de Nova con SQLite funcionando correctamente.' });
});

// Manejo global de errores CORS o de Express
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  logger.error('Error no controlado en el servidor', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Ocurrió un error interno en el servidor local' });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`Servidor modular de Nova con SQLite corriendo`, { url: `http://localhost:${PORT}` });
});
