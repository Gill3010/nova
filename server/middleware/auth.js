const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const logger = require('../utils/logger');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    logger.warn('Petición bloqueada: sin encabezado Authorization');
    return res.status(403).json({ error: 'No se proporcionó un token de seguridad' });
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    logger.warn('Petición bloqueada: token malformado');
    return res.status(403).json({ error: 'Token con formato inválido' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.warn('Petición bloqueada: token expirado o inválido', { error: err.message });
      return res.status(401).json({ error: 'Token expirado o inválido' });
    }
    req.user = decoded; // { id, rol, email, nombre }
    next();
  });
};

const isAdminOrOrganizer = (req, res, next) => {
  if (req.user && (req.user.rol === 'admin' || req.user.rol === 'organizador' || req.user.rol === 'organizer')) {
    return next();
  }
  logger.warn('Petición bloqueada: permisos insuficientes', { user: req.user });
  return res.status(403).json({ error: 'Permisos insuficientes' });
};

module.exports = { verifyToken, isAdminOrOrganizer };
