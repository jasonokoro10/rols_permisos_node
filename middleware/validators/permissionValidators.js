const { body, validationResult } = require('express-validator');

exports.validatePermission = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre del permiso es obligatorio')
        .matches(/^[a-z]+:[a-z]+$/).withMessage('El formato debe ser recurso:accion (ej: tasks:create)'),
    body('description')
        .trim()
        .notEmpty().withMessage('La descripción no puede estar vacía')
        .isLength({ min: 10 }).withMessage('La descripción debe tener al menos 10 caracteres'),
    body('category')
        .trim()
        .notEmpty().withMessage('La categoría es obligatoria'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];
