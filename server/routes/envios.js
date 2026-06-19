/**
 * envios.js — Rutas para gestión de envíos de OJS
 *
 * GET  /api/envios/me            → Envíos del usuario autenticado
 * POST /api/envios               → Registrar nuevo envío (con archivo opcional)
 * PUT  /api/envios/:id           → Actualizar un envío existente
 * GET  /api/envios/archivo/:id   → Servir el archivo del envío en streaming (para visor)
 */
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const enviosController = require('../controllers/envios.controller');

// Multer en memoria: el buffer se pasa al storage.service que decide S3 o local
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB máximo
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF o Word (.pdf, .doc, .docx)'));
    }
  },
});

// 1. Obtener envíos del usuario actual
router.get('/me', verifyToken, enviosController.getEnvios);

// 2. Registrar nuevo envío — con archivo adjunto opcional
router.post('/', verifyToken, upload.single('archivo'), enviosController.createEnvio);

// 3. Actualizar un envío existente
router.put('/:id', verifyToken, enviosController.updateEnvio);

// 4. Servir el archivo del envío en streaming (solo revisores y admins)
router.get('/archivo/:id', verifyToken, enviosController.streamArchivoEnvio);

module.exports = router;
