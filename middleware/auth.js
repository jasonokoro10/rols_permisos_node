const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware de autenticació real mitjançant JWT
 */
const auth = async (req, res, next) => {
    let token;

    // 1. Verificar si el token ve en els headers (Authorization: Bearer <token>)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2. Verificar que el token existeixi
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No autoritzat per accedir a aquesta ruta (token no trobat)'
        });
    }

    try {
        // 3. Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Adjuntar l'usuari a la petició (poblem els rols per a checkPermission)
        req.user = await User.findById(decoded.id).populate('roles');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'L\'usuari vinculat al token ja no existeix'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Token no vàlid o caducat'
        });
    }
};

module.exports = { auth };
