const Role = require('../models/Role');
const Permission = require('../models/Permission');

/**
 * @desc    Crear un nou rol amb permisos
 * @route   POST /api/admin/roles
 */
exports.createRole = async (req, res, next) => {
    try {
        const { name, description, permissions } = req.body;

        // 1. Validar que el rol no existeixi ja
        const existingRole = await Role.findOne({ name: name.toLowerCase() });
        if (existingRole) {
            return res.status(400).json({ success: false, error: 'Aquest rol ja existeix' });
        }

        // 2. Validar que tots els IDs de permisos enviats siguin vàlids
        if (permissions && permissions.length > 0) {
            const validPermissions = await Permission.find({ _id: { $in: permissions } });
            if (validPermissions.length !== permissions.length) {
                return res.status(400).json({ success: false, error: 'Un o més permisos no existeixen' });
            }
        }

        const role = await Role.create({
            name,
            description,
            permissions,
            isSystemRole: false
        });

        res.status(201).json({
            success: true,
            message: 'Rol creat correctament',
            data: role
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Obtenir tots els rols (amb permisos poblats)
 * @route   GET /api/admin/roles
 */
exports.getAllRoles = async (req, res, next) => {
    try {
        const roles = await Role.find().populate('permissions');
        res.status(200).json({ success: true, count: roles.length, data: roles });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Obtenir un rol per ID
 * @route   GET /api/admin/roles/:id
 */
exports.getRoleById = async (req, res, next) => {
    try {
        const role = await Role.findById(req.params.id).populate('permissions');
        if (!role) {
            return res.status(404).json({ success: false, error: 'Rol no trobat' });
        }
        res.status(200).json({ success: true, data: role });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Actualitzar rol (nom, descripció i permisos)
 * @route   PUT /api/admin/roles/:id
 */
exports.updateRole = async (req, res, next) => {
    try {
        const { name, description, permissions } = req.body;
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ success: false, error: 'Rol no trobat' });
        }

        // SEGURETAT: No permetre canviar nom a rols de sistema (admin/user)
        if (role.isSystemRole && name && name !== role.name) {
            return res.status(403).json({ success: false, error: 'No es pot canviar el nom d’un rol de sistema' });
        }

        // Validar permisos si s'estan actualitzant
        if (permissions) {
            const count = await Permission.countDocuments({ _id: { $in: permissions } });
            if (count !== permissions.length) {
                return res.status(400).json({ success: false, error: 'Hi ha IDs de permisos invàlids' });
            }
            role.permissions = permissions;
        }

        role.name = name || role.name;
        role.description = description || role.description;

        await role.save();

        res.status(200).json({ success: true, data: role });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Eliminar un rol (protecció de sistema i reassignació)
 * @route   DELETE /api/admin/roles/:id
 */
exports.deleteRole = async (req, res, next) => {
    try {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ success: false, error: 'Rol no trobat' });
        }

        if (role.isSystemRole) {
            return res.status(403).json({ success: false, error: 'No es pot eliminar un rol del sistema' });
        }

        // En un entorn real, aquí hauries de verificar si hi ha usuaris amb aquest rol
        // i decidir si ho bloqueges o els reassignes al rol 'user' per defecte.

        await role.deleteOne();

        res.status(200).json({ success: true, message: 'Rol eliminat correctament' });
    } catch (error) {
        next(error);
    }
};
