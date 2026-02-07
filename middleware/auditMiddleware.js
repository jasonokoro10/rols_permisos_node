const AuditLog = require('../models/AuditLog'); // Importem el model per desar els logs

/**
 * Middleware especialitzat per a l'auditoria automàtica d'accions.
 * Captura detalls de les peticions que modifiquen dades o rutes d'administració.
 */
const auditMiddleware = async (req, res, next) => {
    // Escollim només els mètodes que realitzen canvis a la base de dades
    const methodsToAudit = ['POST', 'PUT', 'DELETE', 'PATCH'];
    const isAdminRoute = req.originalUrl.includes('/api/admin'); // Verifiquem si és una ruta d'administració

    // Si no és un mètode de canvi i no és ruta d'admin, passem de llarg
    if (!methodsToAudit.includes(req.method) && !isAdminRoute) {
        return next();
    }

    // Utilitzem l'esdeveniment 'finish' per registrar el log quan la petició s'ha completat
    res.on('finish', async () => {
        try { // Bloc d'intent per no bloquejar l'app principal
            // Només auditem si l'usuari ha estat identificat pel middleware d'autenticació
            if (!req.user) return;

            // Determinem l'acció: o bé el permís utilitzat o bé el mètode i la URL
            const action = req.permissionUsed || `${req.method}:${req.originalUrl}`;

            // Definim l'estat en funció del codi HTTP de resposta
            const status = res.statusCode >= 400 ? 'error' : 'success';

            // Intentem extreure l'ID del recurs afectat (de la URL o del body)
            const resource = (req.params && req.params.id) || (req.body && req.body.id) || null;

            // Classificació del tipus de recurs segons l'endpoint utilitzat
            let resourceType = 'unknown';
            if (req.originalUrl.includes('/tasks')) resourceType = 'task';
            if (req.originalUrl.includes('/users')) resourceType = 'user';
            if (req.originalUrl.includes('/roles')) resourceType = 'role';

            // Cridem el mètode estàtic del model AuditLog per desar el registre
            await AuditLog.log({
                userId: req.user._id, // Qui ho ha fet
                action: action, // Què ha fet
                resource: resource, // Sobre què (ID)
                resourceType: resourceType, // Tipus d'objecte
                status: status, // Èxit o Error
                changes: req.auditData || null, // Canvis detallats enviats pel controlador
                errorMessage: status === 'error' ? res.statusMessage : null, // Error HTTP si n'hi ha
                ipAddress: req.ip || req.connection.remoteAddress, // Adreça IP de l'usuari
                userAgent: req.get('User-Agent') // Informació del navegador/sistema
            });
        } catch (error) {
            // El registre d'auditoria no ha de trencar mai l'experiència de l'usuari
            console.error('Error en el middleware d’auditoria:', error);
        }
    });

    next(); // Continuem amb la següent fase de la petició
};

module.exports = auditMiddleware; // Exportem per fer-lo servir globalment a app.js
