const Permission = require('../models/Permission');

/**
 * @desc    Crear un nou permís
 * @route   POST /api/admin/permissions
 */
exports.createPermission = async (req, res, next) => {
    try {
        const { name, description, category } = req.body;

        // Verificar si ja existeix (MongoDB ja ho faria per l'index unique, però així donem un error clar)
        const existing = await Permission.findOne({ name });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Aquest permís ja existeix' });
        }

        const permission = await Permission.create({
            name,
            description,
            category,
            isSystemPermission: false // Els creats per API no solen ser de sistema per defecte
        });

        res.status(201).json({
            success: true,
            message: 'Permís creat correctament',
            data: permission
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Obtenir tots els permisos agrupats per categoria
 * @route   GET /api/admin/permissions
 */
exports.getAllPermissions = async (req, res, next) => {
    try {
        const permissions = await Permission.find().sort({ category: 1, name: 1 });

        // Agrupació per categoria
        const grouped = permissions.reduce((acc, curr) => {
            const cat = curr.category;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(curr);
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            count: permissions.length,
            data: grouped
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Actualitzar descripció d'un permís
 * @route   PUT /api/admin/permissions/:id
 */
exports.updatePermission = async (req, res, next) => {
    try {
        // Només permetem canviar descripció i categoria, NO el nom (per no trencar el codi)
        const { description, category } = req.body;

        const permission = await Permission.findByIdAndUpdate(
            req.params.id,
            { description, category },
            { new: true, runValidators: true }
        );

        if (!permission) {
            return res.status(404).json({ success: false, error: 'Permís no trobat' });
        }

        res.status(200).json({ success: true, data: permission });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Eliminar un permís (protegint els de sistema)
 * @route   DELETE /api/admin/permissions/:id
 */
exports.deletePermission = async (req, res, next) => {
    try {
        const permission = await Permission.findById(req.params.id);

        if (!permission) {
            return res.status(404).json({ success: false, error: 'Permís no trobat' });
        }

        // BLOQUEIG DE SEGURETAT
        if (permission.isSystemPermission) {
            return res.status(403).json({
                success: false,
                error: 'No es pot eliminar un permís protegit del sistema'
            });
        }

        await permission.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Permís eliminat correctament'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Obtenir categories disponibles
 * @route   GET /api/admin/permissions/categories
 */
exports.getCategories = async (req, res, next) => {
    try {
        const categories = await Permission.distinct('category');
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};
