const express = require('express'); // Importem el paquet d'Express
const router = express.Router(); // Creem una nova instància de Router
const {
    getUsers,
    updateUserRoles,
    deleteUser
} = require('../controllers/userController'); // Importem les accions per gestionar usuaris

// Importem els middlewares de seguretat necessaris
const { auth } = require('../middleware/auth'); // Comprova el token JWT d'accés
const checkPermission = require('../middleware/checkPermission'); // Comprova el permís RBAC corresponent

// Totes les rutes de gestió d'usuaris requereixen estar autenticat
router.use(auth);

/**
 * @route   GET /api/admin/users
 * @desc    Llistar tots els usuaris del sistema (permet veure perfils i rols)
 */
router.get('/', checkPermission('users:read'), getUsers);

/**
 * @route   PUT /api/admin/users/:id/roles
 * @desc    Actualitzar l'assignació de rols per a un usuari determinat
 */
router.put('/:id/roles', checkPermission('users:manage'), updateUserRoles);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Esborrar el compte d'un usuari del sistema definitivament
 */
router.delete('/:id', checkPermission('users:manage'), deleteUser);

module.exports = router; // Exportem el router de gestió d'usuaris
