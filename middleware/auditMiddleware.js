const AuditLog = require('../models/AuditLog');

/**
 * Middleware global o específico per a auditar accions
 */
const auditMiddleware = async (req, res, next) => {
    // Solo auditamos métodos que cambian datos o lecturas en /admin
    const methodsToAudit = ['POST', 'PUT', 'DELETE', 'PATCH'];
    const isAdminRoute = req.originalUrl.includes('/api/admin');

    if (!methodsToAudit.includes(req.method) && !isAdminRoute) {
        return next();
    }

    // Escoltem quan la resposta s'ha acabat d'enviar
    res.on('finish', async () => {
        try {
            // Si no hay usuario (ej: login fallido), no podemos auditar por ID
            // a menos que sea una acción de auth, pero aquí priorizamos usuarios logueados
            if (!req.user) return;

            const action = req.permissionUsed || `${req.method}:${req.originalUrl}`;
            const status = res.statusCode >= 400 ? 'error' : 'success';

            // Intentamos obtener el ID del recurso desde los parámetros con seguridad
            const resource = (req.params && req.params.id) || (req.body && req.body.id) || null;

            // Determinamos el tipo de recurso basado en la URL
            let resourceType = 'unknown';
            if (req.originalUrl.includes('/tasks')) resourceType = 'task';
            if (req.originalUrl.includes('/users')) resourceType = 'user';
            if (req.originalUrl.includes('/roles')) resourceType = 'role';

            await AuditLog.log({
                userId: req.user._id,
                action: action,
                resource: resource,
                resourceType: resourceType,
                status: status,
                changes: req.auditData || null, // Los controladores pueden llenar esto
                errorMessage: status === 'error' ? res.statusMessage : null,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            });
        } catch (error) {
            // Importante: No bloqueamos la ejecución principal por un fallo en el log
            console.error('Error en el middleware d’auditoria:', error);
        }
    });

    next();
};

module.exports = auditMiddleware;
