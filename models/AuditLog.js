const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El ID de usuario es obligatorio'],
        index: true // Indexamos para búsquedas rápidas por usuario
    },
    action: {
        type: String,
        required: [true, 'La acción es obligatoria'],
        index: true // Ejemplo: "tasks:update"
    },
    resource: {
        type: String, // ID del recurso (ej: ID de la tarea)
        required: false
    },
    resourceType: {
        type: String, // "task", "user", "role", etc.
        required: false,
        index: true
    },
    status: {
        type: String,
        enum: ['success', 'error'],
        required: true
    },
    changes: {
        type: Object, // Guardaremos { campo: "antes -> después" }
        default: null
    },
    errorMessage: {
        type: String,
        default: null
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

/**
 * MÈTODE ESTÀTIC: Registrar una acción de forma centralizada
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
        // En producción, aquí podrías enviar una alerta a un sistema externo
    }
};

/**
 * MÈTODE ESTÀTIC: Estadístiques bàsiques
 */
auditLogSchema.statics.getStats = async function () {
    return await this.aggregate([
        {
            $facet: {
                totalActions: [{ $count: "count" }],
                topActions: [
                    { $group: { _id: "$action", count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 5 }
                ],
                errors: [
                    { $match: { status: "error" } },
                    { $group: { _id: "$errorMessage", count: { $sum: 1 } } },
                    { $limit: 5 }
                ]
            }
        }
    ]);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
