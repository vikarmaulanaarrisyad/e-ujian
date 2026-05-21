"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderSubjectsSchema = exports.updateSubjectSchema = exports.createSubjectSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createSubjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Nama mata pelajaran minimal 2 karakter'),
    code: zod_1.z.string().min(2, 'Kode mata pelajaran minimal 2 karakter'),
    group: zod_1.z.nativeEnum(client_1.SubjectGroup, { errorMap: () => ({ message: 'Kelompok mata pelajaran tidak valid' }) }),
    order: zod_1.z.number().int().nonnegative().default(0),
});
exports.updateSubjectSchema = exports.createSubjectSchema.partial();
exports.reorderSubjectsSchema = zod_1.z.object({
    subjects: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        order: zod_1.z.number().int().nonnegative(),
    })),
});
