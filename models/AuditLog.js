const mongoose = require('mongoose'); // Importem Mongoose per a la gestió de la base de dades

// Esquema per al registre d'auditoria (Audit Log)
const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // ID de l'usuari que fa l'acció
        ref: 'User', // Referència al model User
        required: [true, 'L’ID de l’usuari és obligatori'], // Missatge d'error en català
        index: true // Millora el rendiment en cerques per usuari
    },
    action: {
        type: String, // Nom de l'acció realitzada (ex: "tasks:update")
        required: [true, 'L’acció és obligatòria'], // Camp obligatori
        index: true // Facilita el filtratge per tipus d'acció
    },
    resource: {
        type: String, // ID del recurs afectat (ID de la tasca, rol, etc.)
        required: false
    },
    resourceType: {
        type: String, // Tipus de recurs: "task", "user", "role", etc.
        required: false,
        index: true
    },
    status: {
        type: String, // Estat del resultat
        enum: ['success', 'error'], // Valors permesos
        required: true
    },
    changes: {
        type: Object, // Desa un resum dels canvis fets (abans -> després)
        default: null
    },
    errorMessage: {
        type: String, // Missatge d'error si el status és 'error'
        default: null
    },
    ipAddress: {
        type: String // Adreça IP des d'on s'ha fet la petició
    },
    userAgent: {
        type: String // Navegador o aplicació utilitzada
    },
    timestamp: {
        type: Date, // Data i hora exacta de l'esdeveniment
        default: Date.now,
        index: true
    }
});

/**
 * MÈTODE ESTÀTIC: Registrar una acció de forma centralitzada
 * Facilita la creació de logs des de qualsevol part de l'aplicació
 */
auditLogSchema.statics.log = async function (data) {
    try {
        return await this.create({
            userId: data.userId,
            action: data.action,
            resource: data.resource,
            resourceType: data.resourceType,
            status: data.status || 'success',
            changes: data.changes,
            errorMessage: data.errorMessage,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent
        });
    } catch (error) {
        console.error('Error guardant el log d’auditoria:', error);
    }
};

/**
 * MÈTODE ESTÀTIC: Obtenir estadístiques d'ús de l'auditoria
 * Utilitza l'operació d'agregació de MongoDB per resumir dades
 */
auditLogSchema.statics.getStats = async function () {
    return await this.aggregate([
        {
            $facet: {
                totalActions: [{ $count: "count" }], // Compta el total de logs
                topActions: [ // Agrupa per accions més freqüents
                    { $group: { _id: "$action", count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 5 }
                ],
                errors: [ // Cerca els errors més comuns
                    { $match: { status: "error" } },
                    { $group: { _id: "$errorMessage", count: { $sum: 1 } } },
                    { $limit: 5 }
                ]
            }
        }
    ]);
};

// Exportem el model AuditLog
module.exports = mongoose.model('AuditLog', auditLogSchema);
