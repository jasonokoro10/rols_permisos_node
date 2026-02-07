const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre del rol es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true
    },
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }],
    isSystemRole: {
        type: Boolean,
        default: false // admin y user vendrán marcados como true desde el seed
    }
}, {
    timestamps: true // Gestiona automáticamente createdAt y updatedAt
});

/**
 * MÈTODE: Verificar si el rol té un permís específic
 * Útil para comprobaciones rápidas si el rol ya está poblado
 */
roleSchema.methods.hasPermission = async function (permissionName) {
    // Aseguramos que los permisos estén cargados (populated)
    await this.populate('permissions');
    return this.permissions.some(p => p.name === permissionName);
};

/**
 * MÈTODE: Afegir un permís al rol (evitant duplicats)
 */
roleSchema.methods.addPermission = function (permissionId) {
    if (!this.permissions.includes(permissionId)) {
        this.permissions.push(permissionId);
    }
    return this.save();
};

/**
 * MÈTODE: Eliminar un permís del rol
 */
roleSchema.methods.removePermission = function (permissionId) {
    this.permissions = this.permissions.filter(
        p => p.toString() !== permissionId.toString()
    );
    return this.save();
};

module.exports = mongoose.model('Role', roleSchema);
