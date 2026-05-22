import { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import bcrypt from 'bcrypt';
import { Role } from '../types/enums';
import { logActivity } from '../lib/activityLog';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const role = (req as any).user.role;

    const whereClause: any = { role: { not: 'SUPER_ADMIN' } };
    if (role !== 'SUPER_ADMIN') {
      whereClause.tenantId = tenantId;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        tenant: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, name, role } = req.body;

    const tenantId = (req as any).user.tenantId;

    if (role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Tidak dapat membuat akun SUPER_ADMIN.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username sudah digunakan.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await (prisma.user.create as any)({
      data: {
        tenantId,
        username,
        password: hashedPassword,
        name,
        role: role as Role,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    logActivity({ req, action: 'CREATE_USER', entity: 'User', entityId: user.id, description: `Menambahkan akun pengguna baru: ${name} (${role})` });

    return res.status(201).json({ message: 'Pengguna berhasil ditambahkan.', data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { username, password, name, role } = req.body;

    const tenantId = (req as any).user.tenantId;

    if (role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Tidak dapat mengubah menjadi SUPER_ADMIN.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || targetUser.tenantId !== tenantId) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }
    
    if (targetUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Tidak dapat mengubah akun SUPER_ADMIN.' });
    }

    // Check if username is being changed to an existing one
    if (username && username !== targetUser.username) {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username sudah digunakan oleh akun lain.' });
      }
    }

    const updateData: any = {};
    if (username) updateData.username = username;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await (prisma.user.update as any)({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      },
    });

    const changes = [];
    if (name) changes.push(`nama: ${name}`);
    if (role) changes.push(`role: ${role}`);
    if (password) changes.push('password diperbarui');
    logActivity({ req, action: 'UPDATE_USER', entity: 'User', entityId: id, description: `Memperbarui akun ${targetUser.name}${changes.length ? ': ' + changes.join(', ') : ''}` });

    return res.status(200).json({ message: 'Pengguna berhasil diperbarui.', data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const tenantId = (req as any).user.tenantId;

    // Prevent deleting oneself
    if ((req as any).user?.id === id) {
      return res.status(400).json({ message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || targetUser.tenantId !== tenantId) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }
    
    if (targetUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Tidak dapat menghapus akun SUPER_ADMIN.' });
    }

    await prisma.user.delete({ where: { id } });

    logActivity({ req, action: 'DELETE_USER', entity: 'User', entityId: id, description: `Menghapus akun pengguna: ${targetUser.name} (${targetUser.role})` });

    return res.status(200).json({ message: 'Pengguna berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};
