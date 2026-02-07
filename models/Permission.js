const mongoose = require('mongoose'); // Importem la llibreria Mongoose per a MongoDB

// Definició de l'esquema per als permisos del sistema
const permissionSchema = new mongoose.Schema({
    name: {
        type: String, // El nom ha de ser una cadena de text
        required: [true, 'El nom del permís és obligatori'], // Camp requerit amb missatge en català
        unique: true, // No poden haver-hi dos permisos amb el mateix nom
        trim: true, // Elimina espais en blanc als extrems
        lowercase: true, // Normalitza el nom a minúscules automàticament
        match: [/^[a-z]+:[a-z]+$/, 'El format ha de ser "recurs:accio" (ex. tasks:create)'] // Validació de format
    },
    description: {
        type: String, // La descripció ha de ser text
        required: [true, 'La descripció és obligatòria'], // Camp obligatori
        trim: true // Neteja espais buits
    },
    category: {
        type: String, // Categoria del permís (admin, tasks, etc)
        required: [true, 'La categoria és obligatòria'], // Camp obligatori
        enum: ['tasks', 'users', 'roles', 'reports', 'permissions', 'audit'], // Llista de valors permesos
        index: true // Crea un índex per millorar la velocitat de cerca
    },
    isSystemPermission: {
        type: Boolean, // Indica si és un permís base de l'aplicació
        default: false // Per defecte és fals, s'activa per protegir permisos crítics
    },
    createdAt: {
        type: Date, // Data de creació del registre
        default: Date.now // Valor per defecte: data i hora actual
    }
}, {
    timestamps: true // Afegeix automàticament camps de "createdAt" i "updatedAt"
});

// Middleware que s'executa abans de desar el permís a la base de dades
permissionSchema.pre('save', function () {
    if (this.name) {
        this.name = this.name.toLowerCase().trim(); // Assegura que el nom estigui net i en minúscules
    }
});

// Exportem el model per poder utilitzar-lo a la resta de l'aplicació
module.exports = mongoose.model('Permission', permissionSchema);
