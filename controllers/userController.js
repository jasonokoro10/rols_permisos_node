const User = require('../models/User');
const Role = require('../models/Role');

/**
 * @desc    Llistar tots els usuaris
 * @route   GET /api/admin/users
 */
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find().populate('roles', 'name description');
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Assignar nous rols a un usuari específic
 * @route   PUT /api/admin/users/:id/roles
 */
exports.updateUserRoles = async (req, res, next) => {
    try {
        const { roles } = req.body; // Array de IDs de rols

        // 1. Validar que els rols existeixen
        if (!Array.isArray(roles)) {
            return res.status(400).json({ success: false, error: 'El camp roles ha de ser un array' });
        }

        const rolesCount = await Role.countDocuments({ _id: { $in: roles } });
        if (rolesCount !== roles.length) {
            return res.status(400).json({ success: false, error: 'Un o més rols no són vàlids' });
        }

        // 2. Actualitzar l'usuari
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { roles },
            { new: true, runValidators: true }
        ).populate('roles', 'name');

        if (!user) {
            return res.status(404).json({ success: false, error: 'Usuari no trobat' });
        }

        // 3. Registrar el canvi en l'auditoria per al middleware
        req.auditData = {
            userId: user._id,
            newRoles: user.roles.map(r => r.name)
        };

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Eliminar usuari
 * @route   DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'Usuari no trobat' });
        }

        // Seguretat: Evitar que un usuari s'elimini a si mateix
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, error: 'No pots eliminar el teu propi compte d’administrador' });
        }

        await user.deleteOne();

        req.auditData = { deletedUser: user.email };

        res.status(200).json({ success: true, message: 'Usuari eliminat correctament' });
    } catch (error) {
        next(error);
    }
};
