"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = void 0;
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
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
        const response = res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
            },
        });
        // Log login — set req.user manually karena middleware belum dijalankan
        req.user = { id: user.id, username: user.username, name: user.name, role: user.role };
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
