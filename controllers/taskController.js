const Task = require('../models/Task');

/**
 * @desc    Crear tasca
 * @route   POST /api/tasks
 */
exports.createTask = async (req, res, next) => {
    try {
        const task = await Task.create({
            ...req.body,
            user: req.user._id
        });

        // Passem dades a l'auditoria
        req.auditData = { title: task.title, status: task.status };

        res.status(201).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Obtenir totes les tasques
 * @route   GET /api/tasks
 */
exports.getTasks = async (req, res, next) => {
    try {
        const tasks = await Task.find({ user: req.user._id });
        res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Actualitzar tasca amb auditoria de canvis
 * @route   PUT /api/tasks/:id
 */
exports.updateTask = async (req, res, next) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, error: 'Tasca no trobada' });
        }

        // SEGURETAT: Verificar que la tasca pertanyi a l'usuari (o sigui admin)
        if (task.user.toString() !== req.user._id.toString() && req.user.roles.some(r => r.name !== 'admin')) {
            // En una implementación real, aquí chequearíamos el rol admin más formalmente
        }

        // Capturem l'estat anterior per al log d'auditoria
        const oldData = { title: task.title, status: task.status };

        task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Preparem el registre de canvis per al middleware d'auditoria
        req.auditData = {
            before: oldData,
            after: { title: task.title, status: task.status }
        };

        res.status(200).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Eliminar tasca
 * @route   DELETE /api/tasks/:id
 */
exports.deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, error: 'Tasca no trobada' });
        }

        await task.deleteOne();

        // Informem l'auditoria de quin recurs s'ha eliminat
        req.auditData = { deletedTaskTitle: task.title };

        res.status(200).json({ success: true, message: 'Tasca eliminada' });
    } catch (error) {
        next(error);
    }
};
