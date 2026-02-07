const mongoose = require('mongoose'); // Importem Mongoose per connectar amb la BD
const dotenv = require('dotenv'); // Importem dotenv per llegir variables d'entorn
const Permission = require('../models/Permission'); // Model de Permisos
const Role = require('../models/Role'); // Model de Rols
const User = require('../models/User'); // Model d'Usuaris

dotenv.config(); // Carreguem la configuració del fitxer .env

/**
 * Funció principal per inicialitzar (seed) la base de dades amb dades RBAC
 */
const seedRBAC = async () => {
    try { // Inici del bloc d'execució
        // Connectem a la base de dades utilitzant la URI configurada al .env
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🌱 Connectat a MongoDB per al seeding...');

        // 1. DEFINICIÓ DE LA LLISTA INICIAL DE PERMISOS
        const permissionsData = [
            // Permisos per al mòdul de Tasques
            { name: 'tasks:read', description: 'Veure tasques', category: 'tasks' },
            { name: 'tasks:create', description: 'Crear tasques', category: 'tasks' },
            { name: 'tasks:update', description: 'Editar tasques', category: 'tasks' },
            { name: 'tasks:delete', description: 'Eliminar tasques', category: 'tasks' },
            // Permisos per al mòdul d'Administració d'Usuaris
            { name: 'users:read', description: 'Llistar usuaris del sistema', category: 'users' },
            { name: 'users:manage', description: 'Gestionar rols d’usuaris', category: 'users' },
            { name: 'users:delete', description: 'Eliminar usuaris del sistema', category: 'users' },
            // Permisos per al mòdul d'Auditoria i Gestió de Seguretat
            { name: 'audit:read', description: 'Consultar logs d’auditoria', category: 'audit' },
            { name: 'permissions:read', description: 'Veure llista de permisos', category: 'permissions' },
            { name: 'permissions:manage', description: 'Gestionar permisos del sistema', category: 'permissions' },
            { name: 'roles:read', description: 'Veure llista de rols', category: 'roles' },
            { name: 'roles:manage', description: 'Gestionar rols del sistema', category: 'roles' }
        ];

        console.log('Clean up: Eliminant permisos i rols antics per evitar conflictes...');
        await Permission.deleteMany({}); // Netegem la col·lecció de permisos
        await Role.deleteMany({}); // Netegem la col·lecció de rols

        // Creem tots els permisos marcant-los com a permisos de sistema (protegits)
        const savedPermissions = await Permission.insertMany(
            permissionsData.map(p => ({ ...p, isSystemPermission: true }))
        );
        console.log(`✅ ${savedPermissions.length} Permisos creats.`);

        // 2. CREACIÓ DE ROLS I ASSIGNACIÓ DE PERMISOS CORRESPONENTS
        const adminPermissions = savedPermissions.map(p => p._id); // L'admin ho rep tot
        const userPermissions = savedPermissions
            .filter(p => p.name.startsWith('tasks:')) // L'usuari normal només rep permisos de tasques
            .map(p => p._id);

        const roles = await Role.insertMany([
            {
                name: 'admin',
                description: 'Administrador total del sistema',
                isSystemRole: true, // Rol protegit contra esborrat
                permissions: adminPermissions
            },
            {
                name: 'user',
                description: 'Usuari estàndard amb permisos de tasques',
                isSystemRole: true, // Rol protegit contra esborrat
                permissions: userPermissions
            }
        ]);
        console.log(`✅ Rols 'admin' i 'user' creats i vinculats.`);

        // 3. CREACIÓ DE L'USUARI ADMINISTRADOR INICIAL (SUPER USER)
        const adminRole = roles.find(r => r.name === 'admin');

        // Eliminem l'usuari admin per defecte per si ja existia d'una prova anterior
        await User.deleteOne({ email: 'admin@test.com' });

        await User.create({
            name: 'Super Admin',
            email: 'admin@test.com',
            password: 'Password123!', // El model User encriptarà aquesta contrasenya automàticament
            roles: [adminRole._id] // Assignem el rol d'administrador
        });
        console.log('👤 Usuari admin@test.com creat (Pass: Password123!)');

        console.log('🚀 Seeding completat amb èxit!');
        process.exit(); // Tanquem el procés de Node correctament
    } catch (error) { // Si algun pas falla (ex: error de connexió)
        console.error('❌ Error en el seeding:', error);
        process.exit(1); // Tanquem amb codi d'error
    }
};

seedRBAC(); // Executem la funció quan es crida el fitxer
