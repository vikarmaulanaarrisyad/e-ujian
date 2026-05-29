"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const db_1 = __importDefault(require("../db"));
const db_2 = require("../db");
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token missing or invalid' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const user = await db_1.default.user.findUnique({
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
            const targetTenant = await db_1.default.tenant.findUnique({ where: { id: activeTenantId } });
            activeTenantName = targetTenant?.name || activeTenantName;
        }
        req.user = {
            ...user,
            tenantId: activeTenantId,
            tenantName: activeTenantName,
        };
        // Run the rest of the request within the active tenant context
        db_2.tenantContext.run(activeTenantId, () => {
            next();
        });
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticateJWT = authenticateJWT;
