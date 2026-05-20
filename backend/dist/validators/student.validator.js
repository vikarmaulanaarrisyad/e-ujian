"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentSchema = exports.createStudentSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createStudentSchema = zod_1.z.object({
    nis: zod_1.z.string().min(3, 'NIS must be at least 3 characters'),
    nisn: zod_1.z.string().length(10, 'NISN must be exactly 10 characters'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    gender: zod_1.z.nativeEnum(client_1.Gender, { errorMap: () => ({ message: 'Gender must be L (Laki-laki) or P (Perempuan)' }) }),
    class: zod_1.z.string().default('6'),
    placeOfBirth: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.preprocess((arg) => {
        if (typeof arg === 'string' && arg)
            return new Date(arg);
        return arg;
    }, zod_1.z.date().optional()),
    parentName: zod_1.z.string().optional(),
});
exports.updateStudentSchema = exports.createStudentSchema.partial();
