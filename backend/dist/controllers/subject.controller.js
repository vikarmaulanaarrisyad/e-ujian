"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderSubjects = exports.deleteSubject = exports.updateSubject = exports.createSubject = exports.getSubjectById = exports.getAllSubjects = void 0;
const db_1 = __importDefault(require("../db"));
const subject_validator_1 = require("../validators/subject.validator");
// Get all subjects
const getAllSubjects = async (req, res, next) => {
    try {
        const subjects = await db_1.default.subject.findMany({
            orderBy: [
                { group: 'asc' },
                { order: 'asc' },
                { name: 'asc' },
            ],
        });
        return res.status(200).json(subjects);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllSubjects = getAllSubjects;
// Get subject by ID
const getSubjectById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const subject = await db_1.default.subject.findUnique({
            where: { id },
        });
        if (!subject) {
            return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan' });
        }
        return res.status(200).json(subject);
    }
    catch (error) {
        next(error);
    }
};
exports.getSubjectById = getSubjectById;
// Create subject
const createSubject = async (req, res, next) => {
    try {
        const validation = subject_validator_1.createSubjectSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: 'Validasi gagal',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const { name, code, group, order } = validation.data;
        // Check code uniqueness
        const existingCode = await db_1.default.subject.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (existingCode) {
            return res.status(400).json({ message: `Kode mata pelajaran '${code}' sudah terdaftar` });
        }
        const subject = await db_1.default.subject.create({
            data: {
                name,
                code: code.toUpperCase(),
                group,
                order,
            },
        });
        return res.status(201).json({
            message: 'Mata pelajaran berhasil ditambahkan',
            subject,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createSubject = createSubject;
// Update subject
const updateSubject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const validation = subject_validator_1.updateSubjectSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: 'Validasi gagal',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const subject = await db_1.default.subject.findUnique({
            where: { id },
        });
        if (!subject) {
            return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan' });
        }
        const { name, code, group, order } = validation.data;
        if (code && code.toUpperCase() !== subject.code) {
            const existingCode = await db_1.default.subject.findUnique({
                where: { code: code.toUpperCase() },
            });
            if (existingCode) {
                return res.status(400).json({ message: `Kode mata pelajaran '${code}' sudah digunakan` });
            }
        }
        const updatedSubject = await db_1.default.subject.update({
            where: { id },
            data: {
                name,
                code: code ? code.toUpperCase() : undefined,
                group,
                order,
            },
        });
        return res.status(200).json({
            message: 'Mata pelajaran berhasil diubah',
            subject: updatedSubject,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSubject = updateSubject;
// Delete subject
const deleteSubject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const subject = await db_1.default.subject.findUnique({
            where: { id },
        });
        if (!subject) {
            return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan' });
        }
        // Optional: Warn if subject has grades (Cascade delete is active, but check helps avoid accidental deletions)
        const reportGradeCount = await db_1.default.reportGrade.count({ where: { subjectId: id } });
        const examGradeCount = await db_1.default.examGrade.count({ where: { subjectId: id } });
        if (reportGradeCount > 0 || examGradeCount > 0) {
            // In this system, we can allow deletion but let's make it explicit or cascade
            // We'll let it execute, but we could also return 400. Let's allow deleting but warn or just let cascade delete happen.
            // Since onDelete: Cascade is in prisma schema, it will work. Let's proceed.
        }
        await db_1.default.subject.delete({
            where: { id },
        });
        return res.status(200).json({ message: 'Mata pelajaran berhasil dihapus' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteSubject = deleteSubject;
// Bulk reorder subjects
const reorderSubjects = async (req, res, next) => {
    try {
        const validation = subject_validator_1.reorderSubjectsSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: 'Validasi gagal',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const { subjects } = validation.data;
        await db_1.default.$transaction(subjects.map((sub) => db_1.default.subject.update({
            where: { id: sub.id },
            data: { order: sub.order },
        })));
        return res.status(200).json({ message: 'Urutan mata pelajaran berhasil disimpan' });
    }
    catch (error) {
        next(error);
    }
};
exports.reorderSubjects = reorderSubjects;
