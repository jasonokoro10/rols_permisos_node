require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');

// Conexió a la base de dades
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conexión a MongoDB exitosa');
    } catch (error) {
        console.error('❌ Error en el arranque del sistema:', error.message);
        process.exit(1);
    }
};

connectDB();

const app = express();

// Trust proxy para capturar la IP real
app.set('trust proxy', true);

// 1. Importar Middlewares
const auditMiddleware = require('./middleware/auditMiddleware');

// 2. Importar Rutes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const roleRoutes = require('./routes/roleRoutes');
const auditRoutes = require('./routes/auditRoutes');
const userRoutes = require('./routes/userRoutes');

// Middlewares bàsics
app.use(express.json());

// 3. Aplicar Auditoria Global
// Monitoritzem totes les peticions POST, PUT, DELETE i rutes d'admin
app.use(auditMiddleware);

// 4. Definició d'Endpoints
app.get('/', (req, res) => {
    res.send('T8: Sistema Avançat de Rols i Permisos amb Auditoria - Jason Okoro');
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Rutes d'Administració (RBAC)
app.use('/api/admin/permissions', permissionRoutes);
app.use('/api/admin/roles', roleRoutes);
app.use('/api/admin/audit', auditRoutes);
app.use('/api/admin/users', userRoutes);

// Gestor d'errors global (obligatori per capturar fallades de permisos)
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Error intern del servidor'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
