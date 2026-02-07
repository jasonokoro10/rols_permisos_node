const mongoose = require('mongoose'); // Importem Mongoose per gestionar l'esquema

// Definició de l'esquema per als Rols del sistema
const roleSchema = new mongoose.Schema({
    name: {
        type: String, // El nom del rol (ex: admin, moderator)
        required: [true, 'El nom del rol és obligatori'], // Camp obligatori amb missatge en català
        unique: true, // No es poden repetir noms de rols
        trim: true, // Neteja espais als extrems
        lowercase: true // Desa sempre en minúscules per evitar duplicitats
    },
    description: {
        type: String, // Descripció de les funcions del rol
        trim: true // Neteja espais
    },
    permissions: [{
        type: mongoose.Schema.Types.ObjectId, // Llista de referències (IDs) a permisos
        ref: 'Permission' // Vincula amb el model Permission
    }],
    isSystemRole: {
        type: Boolean, // Indica si és un rol crític del sistema
        default: false // Per defecte és fals; admin i user solen ser true
    }
}, {
    timestamps: true // Crea automàticament camps de data de creació i modificació
});

/**
 * MÈTODE D'INSTÀNCIA: Verificar si el rol té un permís específic
 * Carrega els permisos si no estan poblats i comprova si existeix el nom del permís
 */
roleSchema.methods.hasPermission = async function (permissionName) {
    await this.populate('permissions'); // Carrega les dades completes dels permisos referenciats
    return this.permissions.some(p => p.name === permissionName); // Comprova si algun coincideix amb el nom buscat
};

/**
 * MÈTODE D'INSTÀNCIA: Afegir un permís al rol (evitant duplicats)
 */
roleSchema.methods.addPermission = function (permissionId) {
    if (!this.permissions.includes(permissionId)) {
        this.permissions.push(permissionId); // Només l'afegeix si no hi és prèviament
    }
    return this.save(); // Desa els canvis a la base de dades
};

/**
 * MÈTODE D'INSTÀNCIA: Eliminar un permís del rol
 */
roleSchema.methods.removePermission = function (permissionId) {
    // Filtra la llista per treure l'ID indicat
    this.permissions = this.permissions.filter(
        p => p.toString() !== permissionId.toString()
    );
    return this.save(); // Desa els canvis actualitzats
};

// Exportem el model Role basat en l'esquema definit
module.exports = mongoose.model('Role', roleSchema);
