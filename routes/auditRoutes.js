const express = require('express');
const router = express.Router();
const {
    getAuditLogs,
    getAuditLogById,
    getAuditStats
} = require('../controllers/auditController');

// Middlewares
const { auth } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// Todas las rutas de auditoría requieren autenticación
router.use(auth);

/**
 * @route   GET /api/admin/audit-logs/stats
 * @desc    Obtenir estadístiques d'ús i errors (Es posa abans de /:id per evitar col·lisió)
 */
router.get('/stats', checkPermission('audit:read'), getAuditStats);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Llistat de logs amb filtres (?userId, ?action, ?page, etc.)
 */
router.get('/', checkPermission('audit:read'), getAuditLogs);

/**
 * @route   GET /api/admin/audit-logs/:id
 * @desc    Detall d'un registre específic
 */
router.get('/:id', checkPermission('audit:read'), getAuditLogById);

module.exports = router;
