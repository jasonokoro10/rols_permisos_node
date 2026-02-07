const express = require('express'); // Importem el paquet Express
const router = express.Router(); // Creem el gestor de rutes (router)
const {
    getAuditLogs,
    getAuditLogById,
    getAuditStats
} = require('../controllers/auditController'); // Importem les funcions del controlador d'auditoria

// Middlewares necessari per a la seguretat i control d'accés
const { auth } = require('../middleware/auth'); // Comprova que el token JWT sigui vàlid
const checkPermission = require('../middleware/checkPermission'); // Comprova el permís RBAC de l'usuari

// Totes les rutes d'auditoria requereixen d'un usuari loguejat correctament
router.use(auth);

/**
 * @route   GET /api/admin/audit/stats
 * @desc    Obtenir estadístiques del sistema de logs i errors detectats
 * Nota: Es declara abans que '/:id' per evitar que Express confongui 'stats' amb un ID
 */
router.get('/stats', checkPermission('audit:read'), getAuditStats);

/**
 * @route   GET /api/admin/audit
 * @desc    Obtenir el llistat complet de logs amb suport de filtres i paginació
 */
router.get('/', checkPermission('audit:read'), getAuditLogs);

/**
 * @route   GET /api/admin/audit/:id
 * @desc    Obtenir la informació detallada d'un registre de log en concret
 */
router.get('/:id', checkPermission('audit:read'), getAuditLogById);

module.exports = router; // Exportem el router amb les rutes d'auditoria configurades
