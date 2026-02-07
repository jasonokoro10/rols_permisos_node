const AuditLog = require('../models/AuditLog');

/**
 * @desc    Obtenir tots els registres amb filtres i paginació
 * @route   GET /api/admin/audit-logs
 */
exports.getAuditLogs = async (req, res, next) => {
    try {
        const { userId, action, startDate, endDate, page = 1, limit = 20 } = req.query;
        const query = {};

        // Filtres dinàmics
        if (userId) query.userId = userId;
        if (action) query.action = action;
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(query)
            .populate('userId', 'name email') // Portem info bàsica de l'usuari
            .sort({ timestamp: -1 }) // El més recent primer
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AuditLog.countDocuments(query);

        res.status(200).json({
            success: true,
            count: total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: logs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Obtenir estadístiques d'activitat
 * @route   GET /api/admin/audit-logs/stats
 */
exports.getAuditStats = async (req, res, next) => {
    try {
        // Fem servir agregació per optimitzar el càlcul al costat del servidor DB
        const stats = await AuditLog.aggregate([
            {
                $facet: {
                    totalActions: [{ $count: "count" }],
                    successRate: [
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ],
                    topActions: [
                        { $group: { _id: "$action", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 5 }
                    ],
                    topUsers: [
                        { $group: { _id: "$userId", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 5 },
                        // Join opcional amb usuaris per tenir el nom
                        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
                        { $unwind: "$userInfo" },
                        { $project: { _id: 1, count: 1, name: "$userInfo.name" } }
                    ]
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Detalls d'un log específic
 * @route   GET /api/admin/audit-logs/:id
 */
exports.getAuditLogById = async (req, res, next) => {
    try {
        const log = await AuditLog.findById(req.params.id).populate('userId', 'name email');
        if (!log) return res.status(404).json({ success: false, error: 'Log no trobat' });

        res.status(200).json({ success: true, data: log });
    } catch (error) {
        next(error);
    }
};
