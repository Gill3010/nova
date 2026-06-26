/**
 * decisiones.js — Rutas para decisiones editoriales
 *
 * POST /api/decisiones-editoriales              → Registrar decisión editorial
 * GET  /api/decisiones-editoriales/pendientes    → Envíos pendientes de decisión
 * GET  /api/decisiones-editoriales/dashboard     → Dashboard completo del editor
 * GET  /api/decisiones-editoriales/:envioId/historial    → Historial de decisiones
 * GET  /api/decisiones-editoriales/:envioId/evaluaciones → Evaluaciones de revisores
 */
const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const decisionesController = require('../controllers/decisiones.controller');

// Todas las rutas requieren autenticación + rol de editor o admin
router.use(verifyToken, authorize('editor', 'admin', 'organizer'));

// Dashboard del editor
router.get('/dashboard', decisionesController.getDashboard);

// Envíos pendientes de decisión
router.get('/pendientes', decisionesController.getPendientes);

// Historial de decisiones de un envío
router.get('/:envioId/historial', decisionesController.getHistorial);

// Evaluaciones detalladas de revisores para un envío
router.get('/:envioId/evaluaciones', decisionesController.getEvaluaciones);

// Registrar una decisión editorial
router.post('/', decisionesController.submitDecision);

module.exports = router;
