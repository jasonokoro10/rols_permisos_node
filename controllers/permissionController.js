const Permission = require('../models/Permission'); // Importem el model de permisos

/**
 * @desc    Crear un nou permís
 * @route   POST /api/admin/permissions
 */
exports.createPermission = async (req, res, next) => { // Funció per crear un permís
    try { // Inici del bloc de control d'errors
        const { name, description, category } = req.body; // Extraiem dades del cos de la petició

        // Verificar si ja existeix (MongoDB ja ho faria per l'index unique, però així donem un error clar)
        const existing = await Permission.findOne({ name }); // Busquem si el permís ja està registrat
        if (existing) { // Si el permís ja existeix
            return res.status(400).json({ success: false, error: 'Aquest permís ja existeix' }); // Retornem error 400
        }

        const permission = await Permission.create({ // Creem el permís a la base de dades
            name, // Nom del permís
            description, // Descripció de la funcionalitat
            category, // Categoria a la qual pertany
            isSystemPermission: false // Marquem que no és un permís base del sistema
        });

        res.status(201).json({ // Resposta d'èxit 201
            success: true, // Indica que l'operació ha anat bé
            message: 'Permís creat correctament', // Missatge confirmant la creació
            data: permission // Enviem les dades del permís creat
        });
    } catch (error) { // Si hi ha un error
        next(error); // Passem l'error al gestor global
    }
};

/**
 * @desc    Obtenir tots els permisos agrupats per categoria
 * @route   GET /api/admin/permissions
 */
exports.getAllPermissions = async (req, res, next) => { // Funció per llistar tots els permisos
    try { // Bloc per capturar errors
        const permissions = await Permission.find().sort({ category: 1, name: 1 }); // Cercar i ordenar per categoria i nom

        // Agrupació per categoria
        const grouped = permissions.reduce((acc, curr) => { // Reduïm per agrupar els permisos
            const cat = curr.category; // Obtenim la categoria actual
            if (!acc[cat]) acc[cat] = []; // Si la categoria no existeix a l'acumulador, la creem
            acc[cat].push(curr); // Afegim el permís a la seva categoria
            return acc; // Retornem l'acumulador per a la següent iteració
        }, {}); // Iniciem amb un objecte buit

        res.status(200).json({ // Resposta d'èxit 200
            success: true, // Operació satisfactòria
            count: permissions.length, // Nombre total de permisos trobats
            data: grouped // Enviem les dades agrupades
        });
    } catch (error) { // En cas d'error
        next(error); // Enviem l'error al següent middleware
    }
};

/**
 * @desc    Actualitzar descripció d'un permís
 * @route   PUT /api/admin/permissions/:id
 */
exports.updatePermission = async (req, res, next) => { // Funció per modificar un permís existent
    try { // Inici del bloc try
        // Només permetem canviar descripció i categoria, NO el nom (per no trencar el codi)
        const { description, category } = req.body; // Obtenim els canvis permesos

        const permission = await Permission.findByIdAndUpdate( // Busquem i actualitzem per l'ID
            req.params.id, // ID passat per la URL
            { description, category }, // Noves dades
            { new: true, runValidators: true } // Retornem el nou objecte i validem dades
        );

        if (!permission) { // Si no s'ha trobat el permís
            return res.status(404).json({ success: false, error: 'Permís no trobat' }); // Error 404
        }

        res.status(200).json({ success: true, data: permission }); // Retornem el permís actualitzat
    } catch (error) { // Captura d'errors
        next(error); // Gestió centralitzada d'errors
    }
};

/**
 * @desc    Eliminar un permís (protegint els de sistema)
 * @route   DELETE /api/admin/permissions/:id
 */
exports.deletePermission = async (req, res, next) => { // Funció per esborrar un permís
    try { // Inici del bloc try
        const permission = await Permission.findById(req.params.id); // Busquem el permís per ID

        if (!permission) { // Si el permís no existeix a la base de dades
            return res.status(404).json({ success: false, error: 'Permís no trobat' }); // Resposta 404
        }

        // BLOQUEIG DE SEGURETAT
        if (permission.isSystemPermission) { // Comprovem si és un permís crític del sistema
            return res.status(403).json({ // Prohibim l'acció amb un 403
                success: false, // Operació fallida
                error: 'No es pot eliminar un permís protegit del sistema' // Missatge de seguretat
            });
        }

        await permission.deleteOne(); // Esborrem el registre de la base de dades

        res.status(200).json({ // Resposta d'èxit
            success: true, // Indica eliminació correcta
            message: 'Permís eliminat correctament' // Confirmació de l'eliminació
        });
    } catch (error) { // Captura de qualsevol fallada
        next(error); // Gestió global de l'error
    }
};

/**
 * @desc    Obtenir categories disponibles
 * @route   GET /api/admin/permissions/categories
 */
exports.getCategories = async (req, res, next) => { // Funció per llistar categories úniques
    try { // Bloc try per a l'operació
        const categories = await Permission.distinct('category'); // Obtenim valors únics del camp category
        res.status(200).json({ success: true, data: categories }); // Enviem la llista de categories
    } catch (error) { // En cas de fallar
        next(error); // Passem l'error al següent pas
    }
};
