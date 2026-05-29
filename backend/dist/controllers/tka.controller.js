"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importTkaGrades = exports.exportTkaGrades = exports.saveTkaGrades = exports.getTkaGrades = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
const db_1 = __importDefault(require("../db"));
const activityLog_1 = require("../lib/activityLog");
const grade_validator_1 = require("../validators/grade.validator");
const fs_1 = __importDefault(require("fs"));
// Helper to get active academic year
const getActiveYear = async (tenantId) => {
    return await db_1.default.academicYear.findFirst({
        where: { tenantId, isActive: true },
        include: { gradeWeights: true },
    });
};
const getCellValueAsString = (cell) => {
    const val = cell.value;
    if (val === null || val === undefined)
        return '';
    if (typeof val === 'object') {
        if ('richText' in val && Array.isArray(val.richText)) {
            return val.richText.map(t => t.text || '').join('').trim();
        }
        if ('result' in val) {
            const result = val.result;
            return result === null || result === undefined ? '' : String(result).trim();
        }
        if (val instanceof Date) {
            return val.toISOString().split('T')[0];
        }
        return JSON.stringify(val).trim();
    }
    return String(val).trim();
};
const getTkaGrades = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const { subjectType } = req.query;
        if (!subjectType || (subjectType !== 'MATEMATIKA' && subjectType !== 'BAHASA_INDONESIA')) {
            return res.status(400).json({ message: 'Invalid or missing subjectType. Use MATEMATIKA or BAHASA_INDONESIA' });
        }
        const activeYear = await getActiveYear(tenantId);
        if (!activeYear) {
            return res.status(200).json({
                academicYearId: null,
                students: [],
            });
        }
        const students = await db_1.default.student.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
            include: {
                tkaGrades: {
                    where: {
                        subjectType: String(subjectType),
                        academicYearId: activeYear.id,
                    },
                },
            },
        });
        const data = students.map((student) => {
            const tkaScore = student.tkaGrades[0]?.score ?? null;
            return {
                studentId: student.id,
                studentName: student.name,
                nis: student.nis,
                nisn: student.nisn,
                score: tkaScore,
            };
        });
        return res.status(200).json({
            subjectType,
            academicYearId: activeYear.id,
            students: data,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTkaGrades = getTkaGrades;
const saveTkaGrades = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const validation = grade_validator_1.saveTkaGradesSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: 'Validation error',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const activeYear = await getActiveYear(tenantId);
        if (!activeYear) {
            return res.status(404).json({ message: 'No active academic year found' });
        }
        const { grades } = validation.data;
        await db_1.default.$transaction(grades.map((g) => db_1.default.tkaGrade.upsert({
            where: {
                tenantId_studentId_subjectType_academicYearId: {
                    tenantId,
                    studentId: g.studentId,
                    subjectType: g.subjectType,
                    academicYearId: activeYear.id,
                },
            },
            update: { score: g.score },
            create: {
                tenantId,
                studentId: g.studentId,
                subjectType: g.subjectType,
                academicYearId: activeYear.id,
                score: g.score,
            },
        })));
        (0, activityLog_1.logActivity)({ req, action: 'SAVE_TKA_GRADES', entity: 'TkaGrade', description: `Menyimpan ${grades.length} nilai TKA (TP: ${activeYear.year})` });
        return res.status(200).json({ message: 'TKA grades saved successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.saveTkaGrades = saveTkaGrades;
const exportTkaGrades = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const { subjectType } = req.query;
        if (!subjectType || (subjectType !== 'MATEMATIKA' && subjectType !== 'BAHASA_INDONESIA')) {
            return res.status(400).json({ message: 'Invalid or missing subjectType. Use MATEMATIKA or BAHASA_INDONESIA' });
        }
        const activeYear = await getActiveYear(tenantId);
        if (!activeYear) {
            return res.status(404).json({ message: 'No active academic year found' });
        }
        const students = await db_1.default.student.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
            include: {
                tkaGrades: {
                    where: {
                        subjectType: String(subjectType),
                        academicYearId: activeYear.id,
                    },
                },
            },
        });
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet(`Nilai TKA - ${subjectType}`);
        worksheet.views = [
            { state: 'frozen', xSplit: 3, ySplit: 1 }
        ];
        worksheet.columns = [
            { key: 'nis', width: 15 },
            { key: 'nisn', width: 15 },
            { key: 'name', width: 30 },
            { key: 'score', width: 15 },
        ];
        const headerBorder = {
            top: { style: 'thin', color: { argb: 'A0A0A0' } },
            left: { style: 'thin', color: { argb: 'A0A0A0' } },
            bottom: { style: 'thin', color: { argb: 'A0A0A0' } },
            right: { style: 'thin', color: { argb: 'A0A0A0' } }
        };
        const row1 = worksheet.getRow(1);
        row1.height = 30;
        row1.getCell(1).value = 'NIS';
        row1.getCell(2).value = 'NISN';
        row1.getCell(3).value = 'Nama Lengkap';
        row1.getCell(4).value = `Nilai TKA ${subjectType === 'MATEMATIKA' ? 'Matematika' : 'Bahasa Indonesia'}`;
        for (let c = 1; c <= 4; c++) {
            const cell = row1.getCell(c);
            cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Arial', size: 11 };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '1F497D' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = headerBorder;
        }
        row1.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
        for (let col = 5; col <= 105; col++) {
            worksheet.getColumn(col).hidden = true;
        }
        students.forEach((student) => {
            const score = student.tkaGrades[0]?.score;
            // Konversi koma kembali jika diperlukan di excel, tapi umumnya ExcelJS lebih baik menyimpan number
            const newRow = worksheet.addRow({
                nis: student.nis,
                nisn: student.nisn,
                name: student.name,
                score: score !== undefined && score !== null ? Number(score) : '',
            });
            newRow.height = 20;
            newRow.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'D9D9D9' } },
                    left: { style: 'thin', color: { argb: 'D9D9D9' } },
                    bottom: { style: 'thin', color: { argb: 'D9D9D9' } },
                    right: { style: 'thin', color: { argb: 'D9D9D9' } }
                };
                if (colNumber === 4) {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
                else {
                    cell.alignment = { vertical: 'middle' };
                    if (colNumber <= 2) {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    }
                }
            });
        });
        const fileName = `nilai_tka_${String(subjectType).toLowerCase()}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        next(error);
    }
};
exports.exportTkaGrades = exportTkaGrades;
const importTkaGrades = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const { subjectType } = req.body;
        if (!subjectType || (subjectType !== 'MATEMATIKA' && subjectType !== 'BAHASA_INDONESIA')) {
            if (req.file)
                fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Invalid or missing subjectType. Use MATEMATIKA or BAHASA_INDONESIA' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No Excel file uploaded' });
        }
        const activeYear = await getActiveYear(tenantId);
        if (!activeYear) {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'No active academic year found' });
        }
        const workbook = new exceljs_1.default.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Worksheet not found' });
        }
        const gradesToUpsert = [];
        const errors = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1)
                return;
            const nis = getCellValueAsString(row.getCell(1));
            const name = getCellValueAsString(row.getCell(3));
            if (!nis && !name)
                return;
            let valRaw = getCellValueAsString(row.getCell(4));
            if (!valRaw)
                return;
            // Handle comma decimal
            valRaw = valRaw.replace(',', '.');
            const score = Number(valRaw);
            if (isNaN(score) || score < 0 || score > 100) {
                errors.push(`Row ${rowNumber}: Score must be a number between 0 and 100.`);
                return;
            }
            gradesToUpsert.push({ nis, score });
        });
        if (errors.length > 0) {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Excel parsing validation errors', errors });
        }
        let savedCount = 0;
        const dbErrors = [];
        await db_1.default.$transaction(async (tx) => {
            for (const item of gradesToUpsert) {
                const student = await tx.student.findFirst({ where: { nis: item.nis, tenantId } });
                if (!student) {
                    throw new Error(`Student with NIS '${item.nis}' not found in the database.`);
                }
                await tx.tkaGrade.upsert({
                    where: {
                        tenantId_studentId_subjectType_academicYearId: {
                            tenantId,
                            studentId: student.id,
                            subjectType: String(subjectType),
                            academicYearId: activeYear.id,
                        },
                    },
                    update: { score: item.score },
                    create: {
                        tenantId,
                        studentId: student.id,
                        subjectType: String(subjectType),
                        academicYearId: activeYear.id,
                        score: item.score,
                    },
                });
                savedCount++;
            }
        }, { maxWait: 100000, timeout: 100000 }).catch((err) => {
            dbErrors.push(err.message);
        });
        fs_1.default.unlinkSync(req.file.path);
        if (dbErrors.length > 0) {
            return res.status(400).json({ message: 'Import failed', errors: dbErrors });
        }
        return res.status(200).json({
            message: `Successfully imported ${savedCount} TKA grades.`,
        });
    }
    catch (error) {
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        next(error);
    }
};
exports.importTkaGrades = importTkaGrades;
