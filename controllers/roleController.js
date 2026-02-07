const Role = require('../models/Role'); // Importem el model de Rols
const Permission = require('../models/Permission'); // Importem el model de Permisos

/**
 * @desc    Crear un nou rol amb permisos
 * @route   POST /api/admin/roles
 */
exports.createRole = async (req, res, next) => { // Funció per crear un nou rol
    try { // Bloc d'intent
        const { name, description, permissions } = req.body; // Recollim les dades del body

        // 1. Validar que el rol no existeixi ja
        const existingRole = await Role.findOne({ name: name.toLowerCase() }); // Busquem per nom en minúscules
        if (existingRole) { // Si el rol ja està registrat
            return res.status(400).json({ success: false, error: 'Aquest rol ja existeix' }); // Informem de l'error 400
        }

        // 2. Validar que tots els IDs de permisos enviats siguin vàlids
        if (permissions && permissions.length > 0) { // Si ens han enviat permisos
            const validPermissions = await Permission.find({ _id: { $in: permissions } }); // Busquem els IDs a la BD
            if (validPermissions.length !== permissions.length) { // Si falten permisos per trobar
                return res.status(400).json({ success: false, error: 'Un o més permisos no existeixen' }); // Error en la llista
            }
        }

        const role = await Role.create({ // Creem el registre del rol
            name, // Nom identificatiu
            description, // Explicació del rol
            permissions, // Array d'IDs de permisos
            isSystemRole: false // Per defecte no és un rol base intocable
        });

        res.status(201).json({ // Resposta d'èxit 201
            success: true, // Indica que s'ha creat bé
            message: 'Rol creat correctament', // Missatge de confirmació
            data: role // Enviem el rol acabat de crear
        });
    } catch (error) { // Si hi ha qualsevol error
        next(error); // Passem l'error al gestor global
    }
};

/**
 * @desc    Obtenir tots els rols (amb permisos poblats)
 * @route   GET /api/admin/roles
 */
exports.getAllRoles = async (req, res, next) => { // Llistar tots els rols del sistema
    try { // Inici del bloc try
        const roles = await Role.find().populate('permissions'); // Busquem tots els rols i carreguem els permisos
        res.status(200).json({ success: true, count: roles.length, data: roles }); // Enviem la llista i el comptador
    } catch (error) { // Captura de falles
        next(error); // Enviem al middleware d'errors
    }
};

/**
 * @desc    Obtenir un rol per ID
 * @route   GET /api/admin/roles/:id
 */
exports.getRoleById = async (req, res, next) => { // Cercar un rol concret per la seva clau primària
    try { // Bloc de control
        const role = await Role.findById(req.params.id).populate('permissions'); // Busquem per ID i enllacem permisos
        if (!role) { // Si l'objecte és buit (no trobat)
            return res.status(404).json({ success: false, error: 'Rol no trobat' }); // Error 404
        }
        res.status(200).json({ success: true, data: role }); // Resposta amb les dades del rol
    } catch (error) { // Gestió d'errors de MongoDB o xarxa
        next(error); // Passem l'error endavant
    }
};

/**
 * @desc    Actualitzar rol (nom, descripció i permisos)
 * @route   PUT /api/admin/roles/:id
 */
exports.updateRole = async (req, res, next) => { // Modificar les dades d'un rol existent
    try { // Bloc principal
        const { name, description, permissions } = req.body; // Parametres de l'actualització
        const role = await Role.findById(req.params.id); // Identifiquem el rol actual

        if (!role) { // Si el recurs no s'ha trobat
            return res.status(404).json({ success: false, error: 'Rol no trobat' }); // Missatge d'error
        }

        // SEGURETAT: No permetre canviar nom a rols de sistema (admin/user)
        if (role.isSystemRole && name && name !== role.name) { // Si és de sistema i es vol canviar el nom
            return res.status(403).json({ success: false, error: 'No es pot canviar el nom d’un rol de sistema' }); // Blocat
        }

        // Validar permisos si s'estan actualitzant
        if (permissions) { // Si el body inclou la llista de permisos
            const count = await Permission.countDocuments({ _id: { $in: permissions } }); // Comptem quants són vàlids
            if (count !== permissions.length) { // Si el comptador no quadra
                return res.status(400).json({ success: false, error: 'Hi ha IDs de permisos invàlids' }); // Error de validació
            }
            role.permissions = permissions; // Actualitzem la llista en memòria
        }

        role.name = name || role.name; // Canviem el nom si s'ha enviat un de nou
        role.description = description || role.description; // Canviem descripció si s'ha enviat

        await role.save(); // Desem els canvis acumulats a l'objecte

        res.status(200).json({ success: true, data: role }); // Retornem el rol modificat
    } catch (error) { // Control de qualsevol problema
        next(error); // Gestió centralitzada
    }
};

/**
 * @desc    Eliminar un rol (protecció de sistema i reassignació)
 * @route   DELETE /api/admin/roles/:id
 */
exports.deleteRole = async (req, res, next) => { // Eliminar un rol de la base de dades
    try { // Inici d'intent
        const role = await Role.findById(req.params.id); // Busquem el rol per l'ID de la URL

        if (!role) { // Si no existeix cap rol amb aquest ID
            return res.status(404).json({ success: false, error: 'Rol no trobat' }); // Resposta 404
        }

        if (role.isSystemRole) { // Protecció per a rols vitals
            return res.status(403).json({ success: false, error: 'No es pot eliminar un rol del sistema' }); // Accés denegat
        }

        // En un entorn real, aquí hauries de verificar si hi ha usuaris amb aquest rol
        // i decidir si ho bloqueges o els reassignes al rol 'user' per defecte.

        await role.deleteOne(); // Esborrem físicament el document de MongoDB

        res.status(200).json({ success: true, message: 'Rol eliminat correctament' }); // Confirmació d'èxit
    } catch (error) { // Error inesperat
        next(error); // Passem l'error al handler d'Express
    }
};
