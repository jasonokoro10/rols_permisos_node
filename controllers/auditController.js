const AuditLog = require('../models/AuditLog'); // Importem el model de logs d'auditoria

/**
 * @desc    Obtenir tots els registres amb filtres i paginació
 * @route   GET /api/admin/audit-logs
 */
exports.getAuditLogs = async (req, res, next) => { // Funció per consultar els logs
    try { // Bloc d'intent
        const { userId, action, startDate, endDate, page = 1, limit = 20 } = req.query; // Extraiem filtres de la petició
        const query = {}; // Objecte buit per construir la consulta

        // Filtres dinàmics
        if (userId) query.userId = userId; // Filtrat per ID d'usuari
        if (action) query.action = action; // Filtrat per tipus d'acció
        if (startDate || endDate) { // Si s'especifica un rang de dades
            query.timestamp = {}; // Iniciem el camp de criteri temporal
            if (startDate) query.timestamp.$gte = new Date(startDate); // Data inici (més gran o igual)
            if (endDate) query.timestamp.$lte = new Date(endDate); // Data fi (més petita o igual)
        }

        const logs = await AuditLog.find(query) // Busquem a la base de dades amb els filtres
            .populate('userId', 'name email') // Carreguem el nom i l'email de l'usuari associat
            .sort({ timestamp: -1 }) // Ordenem els més recents primer
            .limit(limit * 1) // Limitem la quantitat de registres per pàgina
            .skip((page - 1) * limit); // Saltem els registres de pàgines anteriors

        const total = await AuditLog.countDocuments(query); // Comptem el total de registres que quadren

        res.status(200).json({ // Resposta d'èxit 200
            success: true, // Operació realitzada
            count: total, // Total de registres trobats
            pages: Math.ceil(total / limit), // Càlcul del nombre total de pàgines
            currentPage: page, // Pàgina que s'està visualitzant actualment
            data: logs // Llista de registres d'auditoria
        });
    } catch (error) { // Si l'operació falla
        next(error); // Passem l'error al gestor global
    }
};

/**
 * @desc    Obtenir estadístiques d'activitat
 * @route   GET /api/admin/audit-logs/stats
 */
exports.getAuditStats = async (req, res, next) => { // Funció per al resum de dades d'auditoria
    try { // Inici del bloc try
        // Fem servir agregació per optimitzar el càlcul al costat del servidor DB
        const stats = await AuditLog.aggregate([ // Operació d'agregació de MongoDB
            {
                $facet: { // Separem el resultat en múltiples facetes
                    totalActions: [{ $count: "count" }], // Faceta del nombre total d'accions
                    successRate: [ // Faceta per agrupar per l'estat d'èxit o error
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ],
                    topActions: [ // Faceta de les accions més utilitzades
                        { $group: { _id: "$action", count: { $sum: 1 } } }, // Agrupem i sumem
                        { $sort: { count: -1 } }, // Ordenem descendentment
                        { $limit: 5 } // Agafem només els 5 primers
                    ],
                    topUsers: [ // Faceta dels usuaris més actius
                        { $group: { _id: "$userId", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 5 },
                        // Join opcional amb usuaris per tenir el nom
                        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } }, // Relacionem amb usuaris
                        { $unwind: "$userInfo" }, // Desenvolupem l'array del lookup
                        { $project: { _id: 1, count: 1, name: "$userInfo.name" } } // Seleccionem camps a retornar
                    ]
                }
            }
        ]);

        res.status(200).json({ // Enviem el resultat amb un 200
            success: true, // Petició satisfactòria
            data: stats[0] // Retornem el primer element de l'agregació
        });
    } catch (error) { // Error durant l'agregació
        next(error); // Passem l'error
    }
};

/**
 * @desc    Detalls d'un log específic
 * @route   GET /api/admin/audit-logs/:id
 */
exports.getAuditLogById = async (req, res, next) => { // Cercar un log concret pel seu identificador
    try { // Bloc try
        const log = await AuditLog.findById(req.params.id).populate('userId', 'name email'); // Cerquem log i poblarem l'usuari
        if (!log) return res.status(404).json({ success: false, error: 'Log no trobat' }); // Error 404 si no hi és

        res.status(200).json({ success: true, data: log }); // Resposta d'èxit amb les dades
    } catch (error) { // Error de cerca
        next(error); // Passem l'error endavant
    }
};
