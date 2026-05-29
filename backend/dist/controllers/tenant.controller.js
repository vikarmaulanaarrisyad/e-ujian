"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetTenantPassword = exports.deleteTenant = exports.createTenant = exports.getTenants = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../db"));
// Get all tenants
const getTenants = async (req, res, next) => {
    try {
        const tenants = await db_1.default.tenant.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getTenants = getTenants;
// Create a new tenant with initial admin user, school profile, and academic year
const createTenant = async (req, res, next) => {
    try {
        const { name, slug, adminUsername, adminPassword, headmaster, address } = req.body;
        if (!name || !slug || !adminUsername || !adminPassword) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        // Check if slug exists
        const existingSlug = await db_1.default.tenant.findUnique({ where: { slug } });
        if (existingSlug) {
            return res.status(400).json({ message: 'Slug already in use' });
        }
        // Check if username exists
        const existingUser = await db_1.default.user.findUnique({ where: { username: adminUsername } });
        if (existingUser) {
            return res.status(400).json({ message: 'Admin username already in use' });
        }
        const passwordHash = await bcrypt_1.default.hash(adminPassword, 10);
        const newTenant = await db_1.default.tenant.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.createTenant = createTenant;
// Delete a tenant and all its data (cascaded by DB)
const deleteTenant = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Prevent deleting the main system tenant (or we can just rely on the user passing the right ID)
        const tenant = await db_1.default.tenant.findUnique({ where: { id } });
        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }
        if (tenant.slug === 'system') {
            return res.status(403).json({ message: 'Cannot delete the core system tenant' });
        }
        await db_1.default.tenant.delete({
            where: { id }
        });
        return res.status(200).json({ message: 'Tenant and all associated data deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTenant = deleteTenant;
// Reset Tenant Admin Password
const resetTenantPassword = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword) {
            return res.status(400).json({ message: 'Password baru wajib diisi' });
        }
        // Find the admin user for this tenant
        const adminUser = await db_1.default.user.findFirst({
            where: { tenantId: id, role: 'ADMIN' }
        });
        if (!adminUser) {
            return res.status(404).json({ message: 'Admin tenant tidak ditemukan' });
        }
        const passwordHash = await bcrypt_1.default.hash(newPassword, 10);
        await db_1.default.user.update({
            where: { id: adminUser.id },
            data: { password: passwordHash }
        });
        return res.status(200).json({ message: 'Password admin berhasil direset' });
    }
    catch (error) {
        next(error);
    }
};
exports.resetTenantPassword = resetTenantPassword;
