const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre del permiso es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true, // Normalizamos a minúsculas: "tasks:create"
        match: [/^[a-z]+:[a-z]+$/, 'El formato debe ser "recurso:accion" (ej. tasks:create)']
    },
    description: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'La categoría es obligatoria'],
        enum: ['tasks', 'users', 'roles', 'reports', 'permissions', 'audit'],
        index: true
    },
    isSystemPermission: {
        type: Boolean,
        default: false // Si es true, las rutas de DELETE deben bloquear su borrado
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Nos da updatedAt automáticamente
});

// Middleware pre-save para asegurar limpieza de datos
permissionSchema.pre('save', function () {
    if (this.name) {
        this.name = this.name.toLowerCase().trim();
    }
});

module.exports = mongoose.model('Permission', permissionSchema);
