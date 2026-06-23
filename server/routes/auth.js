const express = require('express');
const router = express.Router();
const { z } = require('zod');

const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { verifyToken, authorize } = require('../middleware/auth');

// Esquemas de validación con Zod
const publicRegisterSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('El correo electrónico no tiene un formato válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  // Solo se permiten roles públicos
  rol: z.enum(['speaker', 'organizer', 'attendee', 'reviewer', 'editor'], {
    errorMap: () => ({ message: 'El rol especificado no es válido o no está permitido en el registro público' })
  })
});

const adminRegisterSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('El correo electrónico no tiene un formato válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const loginSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
  'cf-turnstile-response': z.string().optional()
});

// 1. Registro público de usuarios (no admite admin)
router.post('/register', validate(publicRegisterSchema), authController.registerPublic);

// 2. Login de usuarios
router.post('/login', validate(loginSchema), authController.login);

// 3. Registro privado de administradores (Requiere ser admin)
router.post(
  '/admin/register',
  verifyToken,
  authorize('admin'),
  validate(adminRegisterSchema),
  authController.registerAdmin
);

module.exports = router;
