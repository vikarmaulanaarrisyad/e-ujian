"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDefaultSubjects = exports.importSubjects = exports.getSubjectTemplate = exports.reorderSubjects = exports.deleteSubject = exports.updateSubject = exports.createSubject = exports.getSubjectById = exports.getAllSubjects = void 0;
const db_1 = __importDefault(require("../db"));
const subject_validator_1 = require("../validators/subject.validator");
const exceljs_1 = __importDefault(require("exceljs"));
const fs_1 = __importDefault(require("fs"));
// Get all subjects
const getAllSubjects = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const subjects = await db_1.default.subject.findMany({
            where: { tenantId },
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
        const tenantId = req.user.tenantId;
        const { id } = req.params;
        const subject = await db_1.default.subject.findUnique({
            where: { id, tenantId },
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
        const tenantId = req.user.tenantId;
        const validation = subject_validator_1.createSubjectSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: 'Validasi gagal',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const { name, code, group, order } = validation.data;
        // Check code uniqueness
        const existingCode = await db_1.default.subject.findFirst({
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
        const tenantId = req.user.tenantId;
        const { id } = req.params;
        const validation = subject_validator_1.updateSubjectSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: 'Validasi gagal',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const subject = await db_1.default.subject.findUnique({
            where: { id, tenantId },
        });
        if (!subject) {
            return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan' });
        }
        const { name, code, group, order } = validation.data;
        if (code && code.toUpperCase() !== subject.code) {
            const existingCode = await db_1.default.subject.findFirst({
                where: { code: code.toUpperCase() },
            });
            if (existingCode) {
                return res.status(400).json({ message: `Kode mata pelajaran '${code}' sudah digunakan` });
            }
        }
        const updatedSubject = await db_1.default.subject.update({
            where: { id, tenantId },
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
        const tenantId = req.user.tenantId;
        const { id } = req.params;
        const subject = await db_1.default.subject.findUnique({
            where: { id, tenantId },
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
            where: { id, tenantId },
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
        const tenantId = req.user.tenantId;
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
// Download Excel Template
const getSubjectTemplate = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('Mata Pelajaran');
        worksheet.columns = [
            { header: 'Nama Mata Pelajaran', key: 'name', width: 40 },
            { header: 'Kode', key: 'code', width: 20 },
            { header: 'Kelompok', key: 'group', width: 20 },
            { header: 'Urutan', key: 'order', width: 15 },
        ];
        // Add Petunjuk Pengisian sheet
        const instructionSheet = workbook.addWorksheet('Petunjuk Pengisian');
        instructionSheet.columns = [
            { header: 'Kolom', width: 25 },
            { header: 'Keterangan', width: 60 },
            { header: 'Contoh', width: 30 }
        ];
        instructionSheet.addRow(['Nama Mata Pelajaran', 'Wajib diisi. Nama lengkap dari mata pelajaran.', 'Fiqih']);
        instructionSheet.addRow(['Kode', 'Wajib diisi & unik. Singkatan atau kode mata pelajaran.', 'FQH']);
        instructionSheet.addRow(['Kelompok', 'Opsional. Kelompok klasifikasi mata pelajaran.', 'Kelompok A (Muatan Nasional)']);
        instructionSheet.addRow(['Urutan', 'Opsional. Urutan tampilan mata pelajaran (angka).', '1']);
        // Style the instruction header
        instructionSheet.getRow(1).font = { bold: true };
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=template_mata_pelajaran.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        next(error);
    }
};
exports.getSubjectTemplate = getSubjectTemplate;
// Import Subjects from Excel
const importSubjects = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        if (!req.file) {
            return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
        }
        const workbook = new exceljs_1.default.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            return res.status(400).json({ message: 'Format Excel tidak valid' });
        }
        const subjectsToCreate = [];
        let successCount = 0;
        let skipCount = 0;
        worksheet.eachRow((row, rowNumber) => {
            // Skip header row
            if (rowNumber === 1)
                return;
            const name = row.getCell(1).value?.toString().trim();
            const code = row.getCell(2).value?.toString().trim().toUpperCase();
            const rawGroup = row.getCell(3).value?.toString().trim().toUpperCase() || '';
            let group = 'KELOMPOK_A';
            if (rawGroup.includes('B')) {
                group = 'KELOMPOK_B';
            }
            else if (rawGroup.includes('C')) {
                group = 'KELOMPOK_C';
            }
            else if (rawGroup.includes('A')) {
                group = 'KELOMPOK_A';
            }
            let order = parseInt(row.getCell(4).value?.toString() || '0', 10);
            if (isNaN(order))
                order = 0;
            if (name && code) {
                subjectsToCreate.push({ name, code, group, order });
            }
        });
        const existingSubjects = await db_1.default.subject.findMany({ where: { tenantId }, select: { code: true } });
        const existingCodes = new Set(existingSubjects.map(s => s.code));
        for (const sub of subjectsToCreate) {
            if (!existingCodes.has(sub.code)) {
                await db_1.default.subject.create({
                    data: {
                        name: sub.name,
                        code: sub.code,
                        group: sub.group,
                        order: sub.order,
                    }
                });
                existingCodes.add(sub.code);
                successCount++;
            }
            else {
                skipCount++;
            }
        }
        // Clean up uploaded file
        if (fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        return res.status(200).json({
            message: `Berhasil mengimpor ${successCount} mata pelajaran. ${skipCount > 0 ? `(${skipCount} dilewati karena kode duplikat)` : ''}`,
        });
    }
    catch (error) {
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        next(error);
    }
};
exports.importSubjects = importSubjects;
// Generate default subjects
const generateDefaultSubjects = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        // Check if any subject exists
        const existing = await db_1.default.subject.findFirst({ where: { tenantId } });
        if (existing) {
            return res.status(400).json({ message: 'Mata pelajaran sudah ada. Tidak dapat generate data default.' });
        }
        const defaultSubjects = [
            { code: 'QH', name: "Al-Qur'an Hadis", group: 'KELOMPOK_A', order: 1 },
            { code: 'AA', name: 'Akidah Akhlak', group: 'KELOMPOK_A', order: 2 },
            { code: 'FIK', name: 'Fikih', group: 'KELOMPOK_A', order: 3 },
            { code: 'SKI', name: 'Sejarah Kebudayaan Islam', group: 'KELOMPOK_A', order: 4 },
            { code: 'PKN', name: 'Pendidikan Pancasila dan Kewarganegaraan', group: 'KELOMPOK_A', order: 5 },
            { code: 'BIN', name: 'Bahasa Indonesia', group: 'KELOMPOK_A', order: 6 },
            { code: 'BAR', name: 'Bahasa Arab', group: 'KELOMPOK_A', order: 7 },
            { code: 'MTK', name: 'Matematika', group: 'KELOMPOK_A', order: 8 },
            { code: 'IPA', name: 'Ilmu Pengetahuan Alam', group: 'KELOMPOK_A', order: 9 },
            { code: 'IPS', name: 'Ilmu Pengetahuan Sosial', group: 'KELOMPOK_A', order: 10 },
            { code: 'SBDP', name: 'Seni Budaya dan Prakarya', group: 'KELOMPOK_B', order: 1 },
            { code: 'PJOK', name: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', group: 'KELOMPOK_B', order: 2 },
            { code: 'MULOK1', name: 'Muatan Lokal 1', group: 'KELOMPOK_C', order: 1 },
            { code: 'MULOK2', name: 'Muatan Lokal 2', group: 'KELOMPOK_C', order: 2 },
        ];
        await db_1.default.$transaction(defaultSubjects.map((sub) => db_1.default.subject.create({
            data: { ...sub, tenantId },
        })));
        return res.status(201).json({ message: 'Default subjects generated successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.generateDefaultSubjects = generateDefaultSubjects;
