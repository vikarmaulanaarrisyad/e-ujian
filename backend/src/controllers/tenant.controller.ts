import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../db';

// Get all tenants
export const getTenants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        schoolProfiles: true,
        users: {
          where: { role: 'ADMIN' },
          select: { id: true, username: true }
        }
      }
    });
    return res.status(200).json(tenants);
  } catch (error) {
    next(error);
  }
};

// Create a new tenant with initial admin user, school profile, and academic year
export const createTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, adminUsername, adminPassword, headmaster, address } = req.body;

    if (!name || !slug || !adminUsername || !adminPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if slug exists
    const existingSlug = await prisma.tenant.findUnique({ where: { slug } });
    if (existingSlug) {
      return res.status(400).json({ message: 'Slug already in use' });
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({ where: { username: adminUsername } });
    if (existingUser) {
      return res.status(400).json({ message: 'Admin username already in use' });
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const newTenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        users: {
          create: {
            username: adminUsername,
            password: passwordHash,
            name: `Admin ${name}`,
            role: 'ADMIN',
          }
        },
        schoolProfiles: {
          create: {
            name,
            address: address || '',
            headmaster: headmaster || '',
          }
        },
        academicYears: {
          create: {
            year: '2025/2026',
            semester: 'ODD',
            isActive: true,
          }
        }
      },
    });

    return res.status(201).json({
      message: 'Tenant created successfully',
      tenant: newTenant,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a tenant and all its data (cascaded by DB)
export const deleteTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Prevent deleting the main system tenant (or we can just rely on the user passing the right ID)
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (tenant.slug === 'system') {
      return res.status(403).json({ message: 'Cannot delete the core system tenant' });
    }

    await prisma.tenant.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Tenant and all associated data deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Reset Tenant Admin Password
export const resetTenantPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'Password baru wajib diisi' });
    }

    // Find the admin user for this tenant
    const adminUser = await prisma.user.findFirst({
      where: { tenantId: id, role: 'ADMIN' }
    });

    if (!adminUser) {
      return res.status(404).json({ message: 'Admin tenant tidak ditemukan' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: passwordHash }
    });

    return res.status(200).json({ message: 'Password admin berhasil direset' });
  } catch (error) {
    next(error);
  }
};
