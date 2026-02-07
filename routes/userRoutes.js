const express = require('express');
const router = express.Router();
const {
    getUsers,
    updateUserRoles,
    deleteUser
} = require('../controllers/userController');

// Middlewares
const { auth } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// Protecció base: Totes les rutes requereixen login
router.use(auth);

/**
 * @route   GET /api/admin/users
 * @desc    Llistar tots els usuaris
 */
router.get('/', checkPermission('users:read'), getUsers);

/**
 * @route   PUT /api/admin/users/:id/roles
 * @desc    Assignar nous rols a un usuari específic
 */
router.put('/:id/roles', checkPermission('users:manage'), updateUserRoles);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Eliminar usuari
 */
router.delete('/:id', checkPermission('users:manage'), deleteUser);

module.exports = router;
