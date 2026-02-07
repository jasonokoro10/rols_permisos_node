require('dotenv').config(); // Carreguem les variables d'entorn des del fitxer .env
const mongoose = require('mongoose'); // Importem Mongoose per a la connexió amb la BD
const express = require('express'); // Importem el framework Express

// Configuració de la connexió a la base de dades MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI); // Connectem usant la URI del .env
        console.log('✅ Conexión a MongoDB exitosa');
    } catch (error) {
        // Si hi ha un error crític en connectar, aturem el servidor
        console.error('❌ Error en el arranque del sistema:', error.message);
        process.exit(1);
    }
};

connectDB(); // Executem la connexió a la BD al inici de l'app

const app = express(); // Inicialitzem l'aplicació Express

// Trust proxy per capturar correctament l'adreça IP real del client (fonamental per auditoria)
app.set('trust proxy', true);

// 1. Importació de Middlewares Globals
const auditMiddleware = require('./middleware/auditMiddleware'); // Middleware per registrar totes les accions

// 2. Importació de les Rutes de l'aplicació
const authRoutes = require('./routes/authRoutes'); // Rutes per login i registre
const taskRoutes = require('./routes/taskRoutes'); // Rutes de la lògica de tasques
const permissionRoutes = require('./routes/permissionRoutes'); // Rutes de gestió de permisos
const roleRoutes = require('./routes/roleRoutes'); // Rutes de gestió de rols
const auditRoutes = require('./routes/auditRoutes'); // Rutes per consultar els logs d'auditoria
const userRoutes = require('./routes/userRoutes'); // Rutes de gestió d'usuaris (administració)

// Middlewares bàsics de processament
app.use(express.json()); // Permet rebre dades en format JSON al body

// 3. Aplicació del Sistema d'Auditoria Global
// Aquest middleware monitoritza totes les peticions de modificació i rutes d'administrador
app.use(auditMiddleware);

// 4. Definició de punts d'entrada (Endpoints)
// Ruta base de benvinguda
app.get('/', (req, res) => {
    res.send('T8: Sistema Avançat de Rols i Permisos amb Auditoria - Jason Okoro');
});

// Registre de rutes per mòduls
app.use('/api/auth', authRoutes); // Autenticació
app.use('/api/tasks', taskRoutes); // Tasques de l'usuari

// Rutes exclusives d'Administració (Protegides per RBAC)
app.use('/api/admin/permissions', permissionRoutes); // CRUD de permisos
app.use('/api/admin/roles', roleRoutes); // CRUD de rols
app.use('/api/admin/audit', auditRoutes); // Consulta de logs i estadístiques
app.use('/api/admin/users', userRoutes); // Administració de comptes d'usuari

// Gestor d'errors global (Capa final de seguretat)
// Aquest middleware captura qualsevol error que hagi passat per 'next(error)'
app.use((err, req, res, next) => {
    console.error(err.stack); // Mostrem la traça de l'error per consola per a debug
    const statusCode = err.statusCode || 500; // Si no hi ha codi, usem 500 (Error Intern)
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Error intern del servidor'
    });
});

// Definició del port i posada en marxa del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app; // Exportem l'app per si volem fer tests unitaris
