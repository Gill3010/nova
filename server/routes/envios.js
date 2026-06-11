const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const enviosController = require('../controllers/envios.controller');

// 1. Obtener envíos del usuario actual
router.get('/me', verifyToken, enviosController.getEnvios);

// 2. Registrar un nuevo envío de OJS con validación de inputs
router.post('/', verifyToken, enviosController.createEnvio);

// 3. Actualizar un envío de OJS existente con validación de inputs
router.put('/:id', verifyToken, enviosController.updateEnvio);

module.exports = router;
