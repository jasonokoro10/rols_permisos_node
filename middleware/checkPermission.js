/**
 * Middleware per verificar permisos granulars de l'usuari
 * Aquesta funció rep el permís necessari i retorna un middleware d'Express.
 * @param {String} requiredPermission - El nom del permís (ex: 'tasks:delete')
 */
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => { // Retornem la funció middleware asíncrona
        try { // Inici del bloc de control
            // 1. Verificar que l'usuari estigui autenticat (ve de middleware d'auth anterior)
            if (!req.user) { // Si no hi ha usuari a la petició
                return res.status(401).json({ // Retornem error 401: No autoritzat
                    success: false,
                    error: 'No autenticat. Usuari no trobat en la petició.'
                });
            }

            // 2. Verificar el permís utilitzant el mètode hasPermission del model User
            const hasPerm = await req.user.hasPermission(requiredPermission); // Comprovació a la base de dades

            if (!hasPerm) { // Si l'usuari no té el permís requerit
                // Registre log per consola de l'intent d'accés no autoritzat
                console.warn(`Accés denegat: Usuari ${req.user._id} ha intentat ${requiredPermission}`);

                return res.status(403).json({ // Retornem error 403: Prohibit
                    success: false, // Operació denegada
                    hasPermission: false, // Confirmació de falta de permís
                    error: 'No tens permís per fer aquesta acció', // Missatge d'error oficial
                    permission: requiredPermission // Informem de quin permís faltava
                });
            }

            // 3. Si té permís, guardem en la petició quin permís s'ha fet servir
            // Això permet que el middleware d'auditoria registri l'acció correctament més endavant.
            req.permissionUsed = requiredPermission;

            next(); // Permetrem que la petició continuï cap al controlador
        } catch (error) { // Captura de fallades inesperades
            next(error); // Passem l'error al gestor d'errors global (app.js)
        }
    };
};

module.exports = checkPermission; // Exportem el middleware per fer-lo servir a les rutes
