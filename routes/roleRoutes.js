const express = require('express');
const router = express.Router();
const {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    deleteRole
} = require('../controllers/roleController');

// Middlewares
const { auth } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { validateRole } = require('../middleware/validators/roleValidators');

// Protecció base
router.use(auth);

/**
 * Rutes de Gestió de Rols
 */
router.route('/')
    .get(checkPermission('roles:read'), getAllRoles)
    .post(checkPermission('roles:manage'), validateRole, createRole);

router.route('/:id')
    .get(checkPermission('roles:read'), getRoleById)
    .put(checkPermission('roles:manage'), updateRole)
    .delete(checkPermission('roles:manage'), deleteRole);

module.exports = router;
