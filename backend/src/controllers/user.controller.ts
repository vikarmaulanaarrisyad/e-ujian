import { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { logActivity } from '../lib/activityLog';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
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

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username sudah digunakan.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
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

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
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

    const updated = await prisma.user.update({
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

    // Prevent deleting oneself
    if ((req as any).user?.id === id) {
      return res.status(400).json({ message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }

    await prisma.user.delete({ where: { id } });

    logActivity({ req, action: 'DELETE_USER', entity: 'User', entityId: id, description: `Menghapus akun pengguna: ${targetUser.name} (${targetUser.role})` });

    return res.status(200).json({ message: 'Pengguna berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};
