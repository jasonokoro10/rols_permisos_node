const User = require('../models/User'); // Importem el model d'usuari
const Role = require('../models/Role'); // Importem el model de rol

/**
 * @desc    Registre d'usuari
 * @route   POST /api/auth/register
 */
exports.register = async (req, res, next) => { // Funció per registrar un nou compte
    try { // Bloc d'intent
        const { name, email, password } = req.body; // Recollim dades bàsiques de registre

        // 1. Cercar el rol 'user' per defecte per a nous registres
        const defaultRole = await Role.findOne({ name: 'user' }); // Busquem la referència del rol base

        if (!defaultRole) { // Si el sistema no està ben configurat (falta el rol user)
            return res.status(500).json({ // Resposta d'error intern 500
                success: false,
                error: 'Error de configuració: El rol per defecte no existeix.' // Avís de mala instal·lació
            });
        }

        // 2. Crear l'usuari amb el rol assignat automàticament
        const user = await User.create({ // Guardem el nou usuari a la BD
            name, // Nom de l'usuari
            email, // Correu electrònic
            password, // Contrasenya (el model s'encarrega d'encriptar-la)
            roles: [defaultRole._id] // Assignació del rol 'user' per defecte
        });

        // Generar token JWT per iniciar sessió automàticament
        const token = user.getSignedJwtToken(); // Cridem el mètode del model per crear el token

        res.status(201).json({ // Resposta de creació correcta
            success: true, // Indica èxit
            token, // Token d'accés
            message: 'Usuari registrat amb el rol "user"' // Missatge informatiu
        });
    } catch (error) { // Si el registre falla (ex: email ja existent)
        next(error); // Passem l'error al gestor global
    }
};

/**
 * @desc    Login d'usuari
 * @route   POST /api/auth/login
 */
exports.login = async (req, res, next) => { // Funció per validar credencials
    try { // Inici del bloc try
        const { email, password } = req.body; // Dades d'entrada: correu i contrasenya

        // 1. Validar que email i password s'han enviat
        if (!email || !password) { // Si falta algun dels dos camps
            return res.status(400).json({ success: false, error: 'Per favor, introdueix email i contrasenya' }); // Error de validació
        }

        // Busquem l'usuari per email i carreguem els seus rols
        const user = await User.findOne({ email }).populate('roles'); // Cerca amb població de rols
        if (!user || !(await user.matchPassword(password))) { // Si l'usuari no existeix o la clau és errònia
            return res.status(401).json({ success: false, error: 'Credencials invàlides' }); // Error d'autorització 401
        }

        // 2. Obtenir els permisos combinats de tots els rols del seu perfil
        const effectivePermissions = await user.getEffectivePermissions(); // Cridem el mètode de càlcul de permisos

        // 3. Generar el token JWT de sessió
        const token = user.getSignedJwtToken(); // Creació del token segur

        res.status(200).json({ // Resposta d'èxit 200
            success: true, // Operació correcta
            token, // Enviem el token al client (Postman/Frontend)
            user: { // Dades públiques de l'usuari (sense contrasenya)
                id: user._id, // Identificador de BD
                name: user.name, // Nom d'usuari
                email: user.email, // Correu electrònic
                roles: user.roles.map(r => r.name), // Noms del rols que té
                permissions: effectivePermissions // Llista neta de tots els permisos que pot exercir
            }
        });
    } catch (error) { // Si hi ha una fallada durant el procés
        next(error); // Gestió centralitzada de la fallada
    }
};

/**
 * @desc    Verificar si l'usuari loguejat té un permís específic
 * @route   POST /api/auth/check-permission
 */
exports.checkPermission = async (req, res, next) => { // Punt de control manual de permisos
    try { // Inici del procediment
        const { permission } = req.body; // El permís a verificar arriba pel cos del missatge

        if (!permission) { // Si no s'ha indicat quin permís es vol comprovar
            return res.status(400).json({ success: false, error: 'Has d’especificar un permís per verificar' }); // Error 400
        }

        // Cridem el mètode del model d'usuari carregat per el middleware d'auth
        const hasPerm = await req.user.hasPermission(permission); // Comprovació booleana

        res.status(200).json({ // Resposta amb el resultat de la prova
            success: true, // Petició realitzada
            hasPermission: hasPerm, // Indica si el té (true) o no (false)
            message: hasPerm ? 'Tens permís per fer aquesta acció' : 'No tens permís per fer aquesta acció' // Text clar
        });
    } catch (error) { // Error en la consulta o l'execució
        next(error); // Passem el problema al següent pas
    }
};
