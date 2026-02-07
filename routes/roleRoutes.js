const express = require('express'); // Importem el mètode Express
const router = express.Router(); // Iniciem el router
const {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    deleteRole
} = require('../controllers/roleController'); // Importem les accions del controlador de rols

// Carreguem els middlewares de control i validació
const { auth } = require('../middleware/auth'); // Autenticació per token JWT
const checkPermission = require('../middleware/checkPermission'); // Verificació de permisos específics
const { validateRole } = require('../middleware/validators/roleValidators'); // Validador de dades del rol

// Totes les rutes de rols requereixen estar loguejat amb un token vàlid
router.use(auth);

/**
 * Rutes de Gestió Global de Rols (/api/admin/roles)
 */
router.route('/')
    // Llistar rols: requereix el permís 'roles:read'
    .get(checkPermission('roles:read'), getAllRoles)
    // Crear nou rol: requereix 'roles:manage' i passar la validació de dades
    .post(checkPermission('roles:manage'), validateRole, createRole);

/**
 * Rutes d'Operacions sobre un Rol Concret (/api/admin/roles/:id)
 */
router.route('/:id')
    // Veure detall d'un rol: requereix 'roles:read'
    .get(checkPermission('roles:read'), getRoleById)
    // Editar dades del rol: requereix 'roles:manage'
    .put(checkPermission('roles:manage'), updateRole)
    // Eliminar rol del sistema: requereix 'roles:manage' (bloqueja si és rol base)
    .delete(checkPermission('roles:manage'), deleteRole);

module.exports = router; // Exportem el router configurat
