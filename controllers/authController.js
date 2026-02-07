const User = require('../models/User');
const Role = require('../models/Role');

/**
 * @desc    Registre d'usuari
 * @route   POST /api/auth/register
 */
exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // 1. Cercar el rol 'user' per defecte
        const defaultRole = await Role.findOne({ name: 'user' });

        if (!defaultRole) {
            return res.status(500).json({
                success: false,
                error: 'Error de configuració: El rol per defecte no existeix.'
            });
        }

        // 2. Crear l'usuari amb el rol assignat
        const user = await User.create({
            name,
            email,
            password,
            roles: [defaultRole._id] // Assignació automàtica
        });

        // Generar token
        const token = user.getSignedJwtToken();

        res.status(201).json({
            success: true,
            token,
            message: 'Usuari registrat amb el rol "user"'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login d'usuari
 * @route   POST /api/auth/login
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Validar email i password
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Por favor, introduce email y contraseña' });
        }

        const user = await User.findOne({ email }).populate('roles');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, error: 'Credencials invàlides' });
        }

        // 2. Obtenir els permisos combinats (Mètode del Pas 5)
        const effectivePermissions = await user.getEffectivePermissions();

        // 3. Generar token
        const token = user.getSignedJwtToken();

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles.map(r => r.name),
                permissions: effectivePermissions // El frontend usarà això per a la UI
            }
        });
    } catch (error) {
        next(error);
    }
};
/**
 * @desc    Verificar si l'usuari loguejat té un permís específic
 * @route   POST /api/auth/check-permission
 */
exports.checkPermission = async (req, res, next) => {
    try {
        const { permission } = req.body;

        if (!permission) {
            return res.status(400).json({ success: false, error: 'Has d’especificar un permís per verificar' });
        }

        const hasPerm = await req.user.hasPermission(permission);

        res.status(200).json({
            success: true,
            hasPermission: hasPerm,
            message: hasPerm ? 'Tens permís per fer aquesta acció' : 'No tens permís per fer aquesta acció'
        });
    } catch (error) {
        next(error);
    }
};
