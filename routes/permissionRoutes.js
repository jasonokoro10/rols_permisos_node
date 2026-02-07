const express = require('express');
const router = express.Router();
const {
    createPermission,
    getAllPermissions,
    updatePermission,
    deletePermission,
    getCategories
} = require('../controllers/permissionController');

// Middlewares
const { auth } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { validatePermission } = require('../middleware/validators/permissionValidators');

// Totes les rutes de permisos requereixen estar autenticat
router.use(auth);

/**
 * Rutes de Lectura
 */
router.get('/', checkPermission('permissions:read'), getAllPermissions);
router.get('/categories', checkPermission('permissions:read'), getCategories);

/**
 * Rutes d'Escriptura (Només per a qui gestiona permisos)
 */
router.post('/', checkPermission('permissions:manage'), validatePermission, createPermission);
router.put('/:id', checkPermission('permissions:manage'), updatePermission);
router.delete('/:id', checkPermission('permissions:manage'), deletePermission);

module.exports = router;
