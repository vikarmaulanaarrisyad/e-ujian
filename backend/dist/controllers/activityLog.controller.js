"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearOldLogs = exports.getActivityLogsMeta = exports.getActivityLogs = void 0;
const db_1 = __importDefault(require("../db"));
/**
 * GET /activity-logs
 * Query params: page, limit, userId, action, entity, startDate, endDate, search
 */
const getActivityLogs = async (req, res, next) => {
    try {
        const { page = '1', limit = '50', userId, action, entity, startDate, endDate, search, } = req.query;
        const pageNum = Math.max(1, parseInt(String(page)));
        const limitNum = Math.min(100, Math.max(1, parseInt(String(limit))));
        const skip = (pageNum - 1) * limitNum;
        // Build where clause
        const where = {};
        if (userId)
            where.userId = String(userId);
        if (action)
            where.action = String(action);
        if (entity)
            where.entity = String(entity);
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(String(startDate));
            if (endDate) {
                const end = new Date(String(endDate));
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }
        if (search) {
            where.description = { contains: String(search) };
        }
        const [total, logs] = await Promise.all([
            db_1.default.activityLog.count({ where }),
            db_1.default.activityLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
                select: {
                    id: true,
                    userId: true,
                    userName: true,
                    userRole: true,
                    action: true,
                    entity: true,
                    entityId: true,
                    description: true,
                    metadata: true,
                    ipAddress: true,
                    createdAt: true,
                },
            }),
        ]);
        // Hitung total log hari ini
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayCount = await db_1.default.activityLog.count({
            where: { createdAt: { gte: todayStart } },
        });
        return res.status(200).json({
            logs,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
            todayCount,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getActivityLogs = getActivityLogs;
/**
 * GET /activity-logs/meta
 * Kembalikan daftar unique action dan userId untuk opsi filter dropdown
 */
const getActivityLogsMeta = async (req, res, next) => {
    try {
        const [actions, users] = await Promise.all([
            db_1.default.activityLog.findMany({
                distinct: ['action'],
                select: { action: true },
                orderBy: { action: 'asc' },
            }),
            db_1.default.activityLog.findMany({
                distinct: ['userId', 'userName', 'userRole'],
                select: { userId: true, userName: true, userRole: true },
                orderBy: { userName: 'asc' },
            }),
        ]);
        return res.status(200).json({
            actions: actions.map((a) => a.action),
            users: users.filter((u) => u.userId !== null),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getActivityLogsMeta = getActivityLogsMeta;
/**
 * DELETE /activity-logs/old
 * Hapus log yang lebih lama dari N hari (default: 90)
 */
const clearOldLogs = async (req, res, next) => {
    try {
        const days = parseInt(String(req.query.days ?? '90'));
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const result = await db_1.default.activityLog.deleteMany({
            where: { createdAt: { lt: cutoff } },
        });
        return res.status(200).json({
            message: `Berhasil menghapus ${result.count} log aktivitas yang lebih lama dari ${days} hari.`,
            deletedCount: result.count,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.clearOldLogs = clearOldLogs;
