const mongoose = require('mongoose'); // Importem Mongoose per gestionar l'esquema de l'usuari

// Definició de l'esquema d'usuari
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nom és obligatori'], // Camp obligatori
        trim: true
    },
    email: {
        type: String,
        required: [true, 'L\'email és obligatori'], // Validació d'email obligatori
        unique: true, // L'email no es pot repetir al sistema
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Per favor, introdueix un email vàlid']
    },
    password: {
        type: String,
        required: [true, 'La contrasenya és obligatòria'], // Camp obligatori
        minlength: [6, 'La contrasenya ha de tenir almenys 6 caràcters'] // Longitud mínima
    },
    roles: [{
        type: mongoose.Schema.Types.ObjectId, // Referència a la col·lecció de Rols
        ref: 'Role',
        required: true
    }]
}, {
    timestamps: true // Desa automàticament la data de creació i modificació
});

const bcrypt = require('bcryptjs'); // Llibreria per encriptar contrasenyes
const jwt = require('jsonwebtoken'); // Llibreria per gestionar tokens d'autenticació

// Middleware pre-guardat: Encripta la contrasenya abans de desar-la si ha canviat
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return; // Si no s'ha modificat la contrasenya, no fem res
    }
    const salt = await bcrypt.genSalt(10); // Generem una "sal" per a l'encriptació
    this.password = await bcrypt.hash(this.password, salt); // Creem el hash de la contrasenya
});

/**
 * MÈTODE: Signar un JWT i retornar-lo
 * Genera un token amb l'ID de l'usuari i la clau secreta configurada
 */
userSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

/**
 * MÈTODE: Verificar si la contrasenya introduïda coincideix amb l'encriptada
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * MÈTODE: Obtenir tots els permisos "efectius" de l'usuari
 * Recorre tots els rols de l'usuari i extreu una llista única de noms de permisos
 */
userSchema.methods.getEffectivePermissions = async function () {
    // Poblarem els rols i, dins de cada rol, els seus permisos
    const userWithRoles = await this.populate({
        path: 'roles',
        populate: { path: 'permissions' }
    });

    const permissionsSet = new Set(); // Utilitzem un Set per evitar duplicats automàticament

    userWithRoles.roles.forEach(role => {
        if (role.permissions) {
            role.permissions.forEach(permission => {
                permissionsSet.add(permission.name);
            });
        }
    });

    return Array.from(permissionsSet); // Retornem el Set convertit en un Array de noms
};

/**
 * MÈTODE: Verificar si l'usuari té un permís específic comprovant tots els seus rols
 */
userSchema.methods.hasPermission = async function (permissionName) {
    const permissions = await this.getEffectivePermissions();
    return permissions.includes(permissionName); // Retorna true si el permís està a la llista
};

/**
 * MÈTODE: Assignar un nou rol a l'usuari (evitant duplicats d'ID)
 */
userSchema.methods.addRole = function (roleId) {
    if (!this.roles.includes(roleId)) {
        this.roles.push(roleId);
    }
    return this.save();
};

// Exportem el model d'Usuari
module.exports = mongoose.model('User', userSchema);
