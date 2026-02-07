const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');

dotenv.config();

const seedRBAC = async () => {
    try {
        // Usamos MONGODB_URI que es la variable definida en nuestro .env
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🌱 Connectat a MongoDB per al seeding...');

        // 1. DEFINICIÓ DE PERMISOS
        const permissionsData = [
            // Tasques
            { name: 'tasks:read', description: 'Veure tasques', category: 'tasks' },
            { name: 'tasks:create', description: 'Crear tasques', category: 'tasks' },
            { name: 'tasks:update', description: 'Editar tasques', category: 'tasks' },
            { name: 'tasks:delete', description: 'Eliminar tasques', category: 'tasks' },
            // Admin
            { name: 'users:read', description: 'Llistar usuaris del sistema', category: 'users' },
            { name: 'users:manage', description: 'Gestionar rols d’usuaris', category: 'users' },
            { name: 'users:delete', description: 'Eliminar usuaris del sistema', category: 'users' },
            { name: 'audit:read', description: 'Consultar logs d’auditoria', category: 'audit' },
            { name: 'permissions:read', description: 'Veure llista de permisos', category: 'permissions' },
            { name: 'permissions:manage', description: 'Gestionar permisos del sistema', category: 'permissions' },
            { name: 'roles:read', description: 'Veure llista de rols', category: 'roles' },
            { name: 'roles:manage', description: 'Gestionar rols del sistema', category: 'roles' }
        ];

        console.log('Clean up: Eliminant permisos i rols antics para evitar conflictos...');
        await Permission.deleteMany({});
        await Role.deleteMany({});

        const savedPermissions = await Permission.insertMany(
            permissionsData.map(p => ({ ...p, isSystemPermission: true }))
        );
        console.log(`✅ ${savedPermissions.length} Permisos creats.`);

        // 2. CREACIÓ DE ROLS I ASSIGNACIÓ DE PERMISOS
        const adminPermissions = savedPermissions.map(p => p._id);
        const userPermissions = savedPermissions
            .filter(p => p.name.startsWith('tasks:'))
            .map(p => p._id);

        const roles = await Role.insertMany([
            {
                name: 'admin',
                description: 'Administrador total del sistema',
                isSystemRole: true,
                permissions: adminPermissions
            },
            {
                name: 'user',
                description: 'Usuari estàndard amb permisos de tasques',
                isSystemRole: true,
                permissions: userPermissions
            }
        ]);
        console.log(`✅ Rols 'admin' i 'user' creats i vinculats.`);

        // 3. CREACIÓ D'USUARI ADMINISTRADOR INICIAL
        const adminRole = roles.find(r => r.name === 'admin');

        // Eliminamos el admin antiguo para asegurar que se crea con el nuevo hash de bcrypt
        await User.deleteOne({ email: 'admin@test.com' });

        await User.create({
            name: 'Super Admin',
            email: 'admin@test.com',
            password: 'Password123!',
            roles: [adminRole._id]
        });
        console.log('👤 Usuari admin@test.com creat (Pass: Password123!)');

        console.log('🚀 Seeding completat amb èxit!');
        process.exit();
    } catch (error) {
        console.error('❌ Error en el seeding:', error);
        process.exit(1);
    }
};

seedRBAC();
