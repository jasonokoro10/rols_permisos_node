const Task = require('../models/Task'); // Importem el model de Tasca

/**
 * @desc    Crear tasca
 * @route   POST /api/tasks
 */
exports.createTask = async (req, res, next) => { // Funció per afegir una nova tasca
    try { // Inici del bloc try
        const task = await Task.create({ // Creem la tasca a MongoDB
            ...req.body, // Inserim totes les dades del body
            user: req.user._id // Assignem l'ID de l'usuari loguejat a la tasca
        });

        // Passem dades extres a l'auditoria per registrar la funcionalitat
        req.auditData = { title: task.title, status: task.status }; // Camps rellevants per al log

        res.status(201).json({ success: true, data: task }); // Resposta d'èxit 201 amb la nova tasca
    } catch (error) { // Si falla la creació
        next(error); // Passem l'error al gestor global
    }
};

/**
 * @desc    Obtenir totes les tasques de l'usuari actual
 * @route   GET /api/tasks
 */
exports.getTasks = async (req, res, next) => { // Funció per llistar les tasques pròpies
    try { // Bloc de control per a la cerca
        const tasks = await Task.find({ user: req.user._id }); // Filtrem per l'ID de l'usuari autenticat
        res.status(200).json({ success: true, count: tasks.length, data: tasks }); // Retornem el llistat i el total
    } catch (error) { // Error en la consulta
        next(error); // Passem l'error al middleware d'errors
    }
};

/**
 * @desc    Actualitzar tasca amb auditoria de canvis
 * @route   PUT /api/tasks/:id
 */
exports.updateTask = async (req, res, next) => { // Funció per editar una tasca existent
    try { // Inici del procediment
        let task = await Task.findById(req.params.id); // Busquem primer la tasca per validar existència

        if (!task) { // Si el document no s'ha trobat
            return res.status(404).json({ success: false, error: 'Tasca no trobada' }); // Resposta d'error 404
        }

        // SEGURETAT: Verificar que la tasca pertanyi a l'usuari (o que sigui un administrador)
        if (task.user.toString() !== req.user._id.toString() && !req.user.roles.some(r => r.name === 'admin')) {
            return res.status(403).json({ success: false, error: 'No tens permís per editar aquesta tasca' }); // Bloqueig si no es propietari
        }

        // Capturem l'estat actual (abans de canviar-lo) per al log d'auditoria detallat
        const oldData = { title: task.title, status: task.status }; // Estat previ

        task = await Task.findByIdAndUpdate(req.params.id, req.body, { // Apliquem les noves dades
            new: true, // Volem que retorni l'objecte ja actualitzat
            runValidators: true // Forcem que passi les validacions de l'esquema
        });

        // Preparem el registre de canvis per al middleware d'auditoria (Diff check)
        req.auditData = { // Informació detallada sobre el canvi d'estat
            before: oldData, // Com estava abans
            after: { title: task.title, status: task.status } // Com ha quedat ara
        };

        res.status(200).json({ success: true, data: task }); // Resposta final amb l'objecte nou
    } catch (error) { // Fallada durant el procés
        next(error); // Gestió centralitzada
    }
};

/**
 * @desc    Eliminar tasca
 * @route   DELETE /api/tasks/:id
 */
exports.deleteTask = async (req, res, next) => { // Funció per esborrar tasques
    try { // Inici del bloc
        const task = await Task.findById(req.params.id); // Identifiquem la tasca a la BD

        if (!task) { // Si no es troba el ID indicat
            return res.status(404).json({ success: false, error: 'Tasca no trobada' }); // Error 404
        }

        await task.deleteOne(); // Suprimim el registre definitivament de MongoDB

        // Informem l'auditoria de quin recurs s'ha eliminat (per deixar traça)
        req.auditData = { deletedTaskTitle: task.title }; // Registrem el títol de la tasca destruïda

        res.status(200).json({ success: true, message: 'Tasca eliminada' }); // Confirmació al client
    } catch (error) { // Error de xarxa o base de dades
        next(error); // Passem el problema endavant
    }
};
