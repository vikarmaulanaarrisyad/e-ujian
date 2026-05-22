import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { env } from '../config/env';
import { loginSchema } from '../validators/auth.validator';
import { logActivity } from '../lib/activityLog';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { username, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { username },
      include: { tenant: true }, // Include tenant info if needed
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, tenantId: user.tenantId },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    const response = res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name,
      },
    });

    // Log login — set req.user manually karena middleware belum dijalankan
    req.user = { id: user.id, username: user.username, name: user.name, role: user.role, tenantId: user.tenantId } as any;
    logActivity({ req, action: 'LOGIN', entity: 'Auth', description: `${user.name} (${user.role}) berhasil login` });

    return response;
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    return res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

export const switchTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Only Super Admin can switch tenants' });
    }

    const { tenantId } = req.body;
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId is required' });
    }

    const targetTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!targetTenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Sign new JWT with target tenant ID, but KEEP role as SUPER_ADMIN
    const token = jwt.sign(
      { id: req.user.id, username: req.user.username, role: req.user.role, tenantId: targetTenant.id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    const response = res.status(200).json({
      message: 'Switched tenant successfully',
      token,
      user: {
        id: req.user.id,
        username: req.user.username,
        name: req.user.name,
        role: req.user.role,
        tenantId: targetTenant.id,
        tenantName: targetTenant.name,
      },
    });

    logActivity({ req, action: 'SWITCH_TENANT', entity: 'Auth', description: `Super Admin switched to tenant ${targetTenant.name}` });

    return response;
  } catch (error) {
    next(error);
  }
};
