const { body, validationResult } = require('express-validator');

exports.validateRole = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre del rol es obligatorio')
        .isLowercase().withMessage('El nombre del rol debe estar en minúsculas'),
    body('description')
        .trim()
        .notEmpty().withMessage('La descripción es obligatoria'),
    body('permissions')
        .isArray().withMessage('Permissions debe ser un array')
        .notEmpty().withMessage('El rol debe tener al menos un permiso'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];
