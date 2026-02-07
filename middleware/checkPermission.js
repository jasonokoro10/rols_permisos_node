/**
 * Middleware per verificar permisos granulars
 * @param {String} requiredPermission - El nom del permís (ex: 'tasks:delete')
 */
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            // 1. Verificar que l'usuari estigui autenticat (ve de middleware anterior)
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'No autenticat. Usuari no trobat en la petició.'
                });
            }

            // 2. Verificar el permís utilitzant el mètode del model User (Pas 5)
            const hasPerm = await req.user.hasPermission(requiredPermission);

            if (!hasPerm) {
                // Registre opcional per auditoria (ho millorarem al Pas 7)
                console.warn(`Acces denegat: Usuari ${req.user._id} ha intentat ${requiredPermission}`);

                return res.status(403).json({
                    success: false,
                    hasPermission: false,
                    error: 'No tens permís per fer aquesta acció',
                    permission: requiredPermission
                });
            }

            // 3. Si té permís, guardem quin permís s'ha utilitzat (útil per al middleware d'auditoria)
            req.permissionUsed = requiredPermission;

            next();
        } catch (error) {
            next(error); // Passem l'error al gestor d'errors global
        }
    };
};

module.exports = checkPermission;
