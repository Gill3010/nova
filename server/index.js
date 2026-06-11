require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PORT, ALLOWED_ORIGINS } = require('./config');
const logger = require('./utils/logger');

// Inicializar base de datos
const db = require('./db');

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

// Registrar rutas
app.use('/api/auth', authRoutes);
app.use('/api/congresos', congresosRoutes);
app.use('/api/envios', enviosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/espacios', espaciosRoutes);
app.use('/api/actividades', actividadesRoutes);
app.use('/api/portales-ojs', portalesOjsRoutes);

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
