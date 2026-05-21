import { Request, Response, NextFunction } from 'express';
import prisma from '../db';

/**
 * GET /activity-logs
 * Query params: page, limit, userId, action, entity, startDate, endDate, search
 */
export const getActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '50',
      userId,
      action,
      entity,
      startDate,
      endDate,
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit))));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (userId) where.userId = String(userId);
    if (action) where.action = String(action);
    if (entity) where.entity = String(entity);

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
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
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
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
    const todayCount = await prisma.activityLog.count({
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
  } catch (error) {
    next(error);
  }
};

/**
 * GET /activity-logs/meta
 * Kembalikan daftar unique action dan userId untuk opsi filter dropdown
 */
export const getActivityLogsMeta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [actions, users] = await Promise.all([
      prisma.activityLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
      prisma.activityLog.findMany({
        distinct: ['userId', 'userName', 'userRole'],
        select: { userId: true, userName: true, userRole: true },
        orderBy: { userName: 'asc' },
      }),
    ]);

    return res.status(200).json({
      actions: actions.map((a) => a.action),
      users: users.filter((u) => u.userId !== null),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /activity-logs/old
 * Hapus log yang lebih lama dari N hari (default: 90)
 */
export const clearOldLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(String(req.query.days ?? '90'));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await prisma.activityLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    return res.status(200).json({
      message: `Berhasil menghapus ${result.count} log aktivitas yang lebih lama dari ${days} hari.`,
      deletedCount: result.count,
    });
  } catch (error) {
    next(error);
  }
};
