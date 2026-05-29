"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchTenant = exports.getMe = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db"));
const env_1 = require("../config/env");
const auth_validator_1 = require("../validators/auth.validator");
const activityLog_1 = require("../lib/activityLog");
const login = async (req, res, next) => {
    try {
        const validation = auth_validator_1.loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: 'Validation error',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const { username, password } = validation.data;
        const user = await db_1.default.user.findUnique({
            where: { username },
            include: { tenant: true }, // Include tenant info if needed
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role, tenantId: user.tenantId }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
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
        req.user = { id: user.id, username: user.username, name: user.name, role: user.role, tenantId: user.tenantId };
        (0, activityLog_1.logActivity)({ req, action: 'LOGIN', entity: 'Auth', description: `${user.name} (${user.role}) berhasil login` });
        return response;
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        return res.status(200).json({
            user: req.user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
const switchTenant = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Only Super Admin can switch tenants' });
        }
        const { tenantId } = req.body;
        if (!tenantId) {
            return res.status(400).json({ message: 'tenantId is required' });
        }
        const targetTenant = await db_1.default.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!targetTenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }
        // Sign new JWT with target tenant ID, but KEEP role as SUPER_ADMIN
        const token = jsonwebtoken_1.default.sign({ id: req.user.id, username: req.user.username, role: req.user.role, tenantId: targetTenant.id }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
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
        (0, activityLog_1.logActivity)({ req, action: 'SWITCH_TENANT', entity: 'Auth', description: `Super Admin switched to tenant ${targetTenant.name}` });
        return response;
    }
    catch (error) {
        next(error);
    }
};
exports.switchTenant = switchTenant;
