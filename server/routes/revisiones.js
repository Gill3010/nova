/**
 * revisiones.js — Rutas para revisiones del sistema (IA)
 *
 * POST /api/revisiones/sistema       → Recibe veredicto de AWS Lambda (API Key)
 * GET  /api/revisiones/sistema/:id   → Consulta el reporte por envioId (JWT)
 */
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { apiKeyAuth } = require('../middleware/apiKey.middleware');
const revisionesController = require('../controllers/revisiones.controller');

// Recibe el reporte generado por Lambda — autenticado con API Key interna
router.post('/sistema', apiKeyAuth, revisionesController.saveSystemReport);

// El revisor consulta el reporte — autenticado con JWT de Nova
router.get('/sistema/:envioId', verifyToken, revisionesController.getSystemReport);

module.exports = router;
