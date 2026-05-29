"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../types/enums");
exports.loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters long'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
});
exports.createUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters long'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters long'),
    role: zod_1.z.nativeEnum(enums_1.Role, { errorMap: () => ({ message: 'Invalid role. Must be ADMIN, GURU, or STAFF' }) }),
});
exports.updateUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters long').optional(),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long').optional(),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters long').optional(),
    role: zod_1.z.nativeEnum(enums_1.Role).optional(),
});
