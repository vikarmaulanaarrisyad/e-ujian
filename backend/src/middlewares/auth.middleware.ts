import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../db';
import { tenantContext } from '../db';
import { Role } from '../types/enums';

interface JwtPayload {
  id: string;
  username: string;
  role: Role;
  tenantId: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        name: string;
        role: Role;
        tenantId: string;
        tenantName?: string;
      };
    }
  }
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, name: true, role: true, tenantId: true, tenant: { select: { name: true } } },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    let activeTenantId = user.tenantId;
    let activeTenantName = user.tenant?.name;

    // If SUPER_ADMIN, allow them to impersonate the tenantId stored in the token
    if (user.role === 'SUPER_ADMIN' && decoded.tenantId && decoded.tenantId !== user.tenantId) {
      activeTenantId = decoded.tenantId;
      // Fetch the impersonated tenant name
      const targetTenant = await prisma.tenant.findUnique({ where: { id: activeTenantId } });
      activeTenantName = targetTenant?.name || activeTenantName;
    }

    req.user = {
      ...user,
      tenantId: activeTenantId,
      tenantName: activeTenantName,
    } as any;
    
    // Run the rest of the request within the active tenant context
    tenantContext.run(activeTenantId, () => {
      next();
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
