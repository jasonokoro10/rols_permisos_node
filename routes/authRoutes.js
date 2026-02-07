const express = require('express');
const router = express.Router();
const { register, login, checkPermission } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Registre d'usuari
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login d'usuari
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/check-permission
 * @desc    Verificar permís de l'usuari actual
 */
router.post('/check-permission', auth, checkPermission);

module.exports = router;
