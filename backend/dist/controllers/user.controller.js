"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUsers = void 0;
const db_1 = __importDefault(require("../db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const activityLog_1 = require("../lib/activityLog");
const getUsers = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const role = req.user.role;
        const whereClause = { role: { not: 'SUPER_ADMIN' } };
        if (role !== 'SUPER_ADMIN') {
            whereClause.tenantId = tenantId;
        }
        const users = await db_1.default.user.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
const createUser = async (req, res, next) => {
    try {
        const { username, password, name, role } = req.body;
        const tenantId = req.user.tenantId;
        if (role === 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Tidak dapat membuat akun SUPER_ADMIN.' });
        }
        const existingUser = await db_1.default.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username sudah digunakan.' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await db_1.default.user.create({
            data: {
                tenantId,
                username,
                password: hashedPassword,
                name,
                role: role,
            },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });
        (0, activityLog_1.logActivity)({ req, action: 'CREATE_USER', entity: 'User', entityId: user.id, description: `Menambahkan akun pengguna baru: ${name} (${role})` });
        return res.status(201).json({ message: 'Pengguna berhasil ditambahkan.', data: user });
    }
    catch (error) {
        next(error);
    }
};
exports.createUser = createUser;
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { username, password, name, role } = req.body;
        const tenantId = req.user.tenantId;
        if (role === 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Tidak dapat mengubah menjadi SUPER_ADMIN.' });
        }
        const targetUser = await db_1.default.user.findUnique({ where: { id } });
        if (!targetUser || targetUser.tenantId !== tenantId) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }
        if (targetUser.role === 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Tidak dapat mengubah akun SUPER_ADMIN.' });
        }
        // Check if username is being changed to an existing one
        if (username && username !== targetUser.username) {
            const existingUser = await db_1.default.user.findUnique({ where: { username } });
            if (existingUser) {
                return res.status(400).json({ message: 'Username sudah digunakan oleh akun lain.' });
            }
        }
        const updateData = {};
        if (username)
            updateData.username = username;
        if (name)
            updateData.name = name;
        if (role)
            updateData.role = role;
        if (password) {
            updateData.password = await bcrypt_1.default.hash(password, 10);
        }
        const updated = await db_1.default.user.update({
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
        if (name)
            changes.push(`nama: ${name}`);
        if (role)
            changes.push(`role: ${role}`);
        if (password)
            changes.push('password diperbarui');
        (0, activityLog_1.logActivity)({ req, action: 'UPDATE_USER', entity: 'User', entityId: id, description: `Memperbarui akun ${targetUser.name}${changes.length ? ': ' + changes.join(', ') : ''}` });
        return res.status(200).json({ message: 'Pengguna berhasil diperbarui.', data: updated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;
        // Prevent deleting oneself
        if (req.user?.id === id) {
            return res.status(400).json({ message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
        }
        const targetUser = await db_1.default.user.findUnique({ where: { id } });
        if (!targetUser || targetUser.tenantId !== tenantId) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }
        if (targetUser.role === 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Tidak dapat menghapus akun SUPER_ADMIN.' });
        }
        await db_1.default.user.delete({ where: { id } });
        (0, activityLog_1.logActivity)({ req, action: 'DELETE_USER', entity: 'User', entityId: id, description: `Menghapus akun pengguna: ${targetUser.name} (${targetUser.role})` });
        return res.status(200).json({ message: 'Pengguna berhasil dihapus.' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUser = deleteUser;
