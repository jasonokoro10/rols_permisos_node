const express = require('express'); // Importem Express
const router = express.Router(); // Creem una instància del router d'Express
const {
    createPermission,
    getAllPermissions,
    updatePermission,
    deletePermission,
    getCategories
} = require('../controllers/permissionController'); // Importem els mètodes del controlador de permisos

// Importem els middlewares de seguretat i validació
const { auth } = require('../middleware/auth'); // Middleware d'autenticació JWT
const checkPermission = require('../middleware/checkPermission'); // Middleware de verificació de permisos RBAC
const { validatePermission } = require('../middleware/validators/permissionValidators'); // Validador de dades d'entrada

// Totes les rutes definides en aquest fitxer requereixen token vàlid (autenticació)
router.use(auth);

/**
 * Rutes de Lectura de Permisos
 */
// Obtenir tots els permisos - Requereix permís de lectura
router.get('/', checkPermission('permissions:read'), getAllPermissions);
// Obtenir llista de categories úniques - Requereix permís de lectura
router.get('/categories', checkPermission('permissions:read'), getCategories);

/**
 * Rutes d'Escriptura i Gestió (Limitades a usuaris amb privilegis de gestió)
 */
// Crear un nou permís - Requereix permisos:manage i validació de dades
router.post('/', checkPermission('permissions:manage'), validatePermission, createPermission);
// Actualitzar un permís existent - Requereix permisos:manage
router.put('/:id', checkPermission('permissions:manage'), updatePermission);
// Esborrar un permís - Requereix permisos:manage
router.delete('/:id', checkPermission('permissions:manage'), deletePermission);

module.exports = router; // Exportem les rutes per registrar-les a app.js
