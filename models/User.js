const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, introduce un email válido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    }]
}, {
    timestamps: true
});

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware: Encriptar password antes de guardar
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

/**
 * MÈTODE: Signar JWT i retornar-lo
 */
userSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

/**
 * MÈTODE: Verificar si el password coincideix amb l'encriptat
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * MÈTODE: Obtenir tots els permisos "efectius" de l'usuari
 * Combina els permisos de tots els rols que tingui l'usuari.
 */
userSchema.methods.getEffectivePermissions = async function () {
    // Poblamos los roles y dentro de cada rol, sus permisos
    const userWithRoles = await this.populate({
        path: 'roles',
        populate: { path: 'permissions' }
    });

    const permissionsSet = new Set();

    userWithRoles.roles.forEach(role => {
        if (role.permissions) {
            role.permissions.forEach(permission => {
                permissionsSet.add(permission.name);
            });
        }
    });

    return Array.from(permissionsSet);
};

/**
 * MÈTODE: Verificar si l'usuari té un permís específic
 */
userSchema.methods.hasPermission = async function (permissionName) {
    const permissions = await this.getEffectivePermissions();
    return permissions.includes(permissionName);
};

/**
 * MÈTODE: Assignar un rol a l'usuari
 */
userSchema.methods.addRole = function (roleId) {
    if (!this.roles.includes(roleId)) {
        this.roles.push(roleId);
    }
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
