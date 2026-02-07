const express = require('express');
const router = express.Router();
const {
    createTask,
    getTasks,
    updateTask,
    deleteTask
} = require('../controllers/taskController');

// Middlewares
const { auth } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// Protecció base: Totes les rutes de tasques requereixen login
router.use(auth);

/**
 * @route   GET /api/tasks
 * @desc    Obtenir totes les tasques de l'usuari
 */
router.get('/', checkPermission('tasks:read'), getTasks);

/**
 * @route   POST /api/tasks
 * @desc    Crear una nova tasca
 */
router.post('/', checkPermission('tasks:create'), createTask);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Actualitzar una tasca existent
 */
router.put('/:id', checkPermission('tasks:update'), updateTask);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Eliminar una tasca
 */
router.delete('/:id', checkPermission('tasks:delete'), deleteTask);

module.exports = router;
