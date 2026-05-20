"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importStudents = exports.exportStudents = exports.getStudentTemplate = exports.deleteStudent = exports.updateStudent = exports.createStudent = exports.getStudentById = exports.getAllStudents = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
const db_1 = __importDefault(require("../db"));
const student_validator_1 = require("../validators/student.validator");
const fs_1 = __importDefault(require("fs"));
// Get all students
const getAllStudents = async (req, res, next) => {
    try {
        const { name, nis, class: className } = req.query;
        const filter = {};
        if (name) {
            filter.name = { contains: String(name) };
        }
        if (nis) {
            filter.nis = { contains: String(nis) };
        }
        if (className) {
            filter.class = String(className);
        }
        const students = await db_1.default.student.findMany({
            where: filter,
            orderBy: { name: 'asc' },
        });
        return res.status(200).json(students);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllStudents = getAllStudents;
// Get single student
const getStudentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const student = await db_1.default.student.findUnique({
            where: { id },
        });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        return res.status(200).json(student);
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentById = getStudentById;
// Create student
const createStudent = async (req, res, next) => {
    try {
        const validation = student_validator_1.createStudentSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: 'Validation error',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const { nis, nisn } = validation.data;
        const existingNis = await db_1.default.student.findUnique({ where: { nis } });
        if (existingNis) {
            return res.status(400).json({ message: 'NIS already registered' });
        }
        const existingNisn = await db_1.default.student.findUnique({ where: { nisn } });
        if (existingNisn) {
            return res.status(400).json({ message: 'NISN already registered' });
        }
        const student = await db_1.default.student.create({
            data: validation.data,
        });
        return res.status(201).json({
            message: 'Student created successfully',
            student,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createStudent = createStudent;
// Update student
const updateStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const validation = student_validator_1.updateStudentSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: 'Validation error',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const student = await db_1.default.student.findUnique({ where: { id } });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        const { nis, nisn } = validation.data;
        if (nis && nis !== student.nis) {
            const existingNis = await db_1.default.student.findUnique({ where: { nis } });
            if (existingNis) {
                return res.status(400).json({ message: 'NIS already registered' });
            }
        }
        if (nisn && nisn !== student.nisn) {
            const existingNisn = await db_1.default.student.findUnique({ where: { nisn } });
            if (existingNisn) {
                return res.status(400).json({ message: 'NISN already registered' });
            }
        }
        const updatedStudent = await db_1.default.student.update({
            where: { id },
            data: validation.data,
        });
        return res.status(200).json({
            message: 'Student updated successfully',
            student: updatedStudent,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateStudent = updateStudent;
// Delete student
const deleteStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const student = await db_1.default.student.findUnique({ where: { id } });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        await db_1.default.student.delete({
            where: { id },
        });
        return res.status(200).json({ message: 'Student deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteStudent = deleteStudent;
// Get empty Excel template
const getStudentTemplate = async (req, res, next) => {
    try {
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('Template Siswa');
        worksheet.columns = [
            { header: 'NIS', key: 'nis', width: 15 },
            { header: 'NISN', key: 'nisn', width: 15 },
            { header: 'Nama Lengkap', key: 'name', width: 30 },
            { header: 'Jenis Kelamin (L/P)', key: 'gender', width: 15 },
            { header: 'Tempat Lahir', key: 'placeOfBirth', width: 20 },
            { header: 'Tanggal Lahir (YYYY-MM-DD)', key: 'dateOfBirth', width: 25 },
            { header: 'Nama Wali / Orang Tua', key: 'parentName', width: 30 },
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.addRow({
            nis: '2026001',
            nisn: '0123456789',
            name: 'Budi Santoso',
            gender: 'L',
            placeOfBirth: 'Bondowoso',
            dateOfBirth: '2014-05-12',
            parentName: 'Slamet Santoso',
        });
        worksheet.addRow({
            nis: '2026002',
            nisn: '0987654321',
            name: 'Siti Aminah',
            gender: 'P',
            placeOfBirth: 'Bondowoso',
            dateOfBirth: '2014-08-22',
            parentName: 'Ahmad Fauzi',
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="template_siswa.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentTemplate = getStudentTemplate;
// Export students to Excel
const exportStudents = async (req, res, next) => {
    try {
        const students = await db_1.default.student.findMany({
            orderBy: { name: 'asc' },
        });
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('Data Siswa');
        worksheet.columns = [
            { header: 'NIS', key: 'nis', width: 15 },
            { header: 'NISN', key: 'nisn', width: 15 },
            { header: 'Nama Lengkap', key: 'name', width: 30 },
            { header: 'Jenis Kelamin (L/P)', key: 'gender', width: 15 },
            { header: 'Tempat Lahir', key: 'placeOfBirth', width: 20 },
            { header: 'Tanggal Lahir (YYYY-MM-DD)', key: 'dateOfBirth', width: 25 },
            { header: 'Nama Wali / Orang Tua', key: 'parentName', width: 30 },
        ];
        worksheet.getRow(1).font = { bold: true };
        students.forEach((student) => {
            worksheet.addRow({
                nis: student.nis,
                nisn: student.nisn,
                name: student.name,
                gender: student.gender,
                placeOfBirth: student.placeOfBirth || '',
                dateOfBirth: student.dateOfBirth ? student.dateOfBirth.toISOString().split('T')[0] : '',
                parentName: student.parentName || '',
            });
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="data_siswa.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        next(error);
    }
};
exports.exportStudents = exportStudents;
// Helper to safely extract string value from Excel cell
const getCellValueAsString = (cell) => {
    const val = cell.value;
    if (val === null || val === undefined)
        return '';
    if (typeof val === 'object') {
        // Check richText
        if ('richText' in val && Array.isArray(val.richText)) {
            return val.richText.map(t => t.text || '').join('').trim();
        }
        // Check formula result
        if ('result' in val) {
            const result = val.result;
            return result === null || result === undefined ? '' : String(result).trim();
        }
        // Check Date
        if (val instanceof Date) {
            return val.toISOString().split('T')[0];
        }
        return JSON.stringify(val).trim();
    }
    return String(val).trim();
};
// Flexible date parsing helper for various Excel inputs (serial numbers, Date objects, DMY strings, ISO strings)
const parseFlexibleDate = (val) => {
    if (val === null || val === undefined || val === '')
        return null;
    if (val instanceof Date) {
        return isNaN(val.getTime()) ? null : val;
    }
    if (typeof val === 'number') {
        // Excel serial date epoch begins Dec 30, 1899. There are 86400 seconds in a day.
        const date = new Date((val - 25569) * 86400 * 1000);
        return isNaN(date.getTime()) ? null : date;
    }
    if (typeof val === 'object') {
        if ('result' in val) {
            return parseFlexibleDate(val.result);
        }
        if ('richText' in val) {
            const str = val.richText.map((t) => t.text || '').join('').trim();
            return parseFlexibleDate(str);
        }
    }
    if (typeof val === 'string') {
        const str = val.trim();
        if (!str)
            return null;
        // Test standard parsing (e.g. YYYY-MM-DD or standard Date-parseable string)
        let parsed = new Date(str);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
        // Parse DD/MM/YYYY or DD-MM-YYYY (allowing optional trailing time/spaces)
        const dmyMatch = str.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/);
        if (dmyMatch) {
            const day = parseInt(dmyMatch[1], 10);
            const month = parseInt(dmyMatch[2], 10) - 1; // Month is 0-indexed in JS
            const year = parseInt(dmyMatch[3], 10);
            parsed = new Date(year, month, day);
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
        }
    }
    return null;
};
// Import students from Excel
const importStudents = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No Excel file uploaded' });
        }
        const workbook = new exceljs_1.default.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            return res.status(400).json({ message: 'Excel worksheet not found' });
        }
        const studentsToInsert = [];
        const errors = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1)
                return; // Skip header
            const nis = getCellValueAsString(row.getCell(1));
            const nisn = getCellValueAsString(row.getCell(2));
            const name = getCellValueAsString(row.getCell(3));
            const genderRaw = getCellValueAsString(row.getCell(4)).toUpperCase();
            const placeOfBirth = getCellValueAsString(row.getCell(5));
            const dateCell = row.getCell(6);
            const parentName = getCellValueAsString(row.getCell(7));
            if (!nis && !nisn && !name)
                return; // Skip empty row
            if (!nis || !nisn || !name || !genderRaw) {
                errors.push(`Row ${rowNumber}: Mandatory fields (NIS, NISN, Nama, Gender) are missing.`);
                return;
            }
            if (genderRaw !== 'L' && genderRaw !== 'P') {
                errors.push(`Row ${rowNumber}: Gender must be L or P.`);
                return;
            }
            let dateOfBirth = null;
            if (dateCell.value !== null && dateCell.value !== undefined && dateCell.value !== '') {
                const parsedDate = parseFlexibleDate(dateCell.value);
                if (parsedDate) {
                    dateOfBirth = parsedDate;
                }
                else {
                    console.error(`[Excel Date Parser Failure] Row ${rowNumber}: Raw Value =`, dateCell.value, 'Type =', typeof dateCell.value);
                    errors.push(`Row ${rowNumber}: Date of Birth format is invalid (value: ${dateCell.value}).`);
                    return;
                }
            }
            studentsToInsert.push({
                nis,
                nisn,
                name,
                gender: genderRaw,
                placeOfBirth: placeOfBirth || null,
                dateOfBirth,
                parentName: parentName || null,
            });
        });
        if (errors.length > 0) {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Error parsing Excel file', errors });
        }
        let successCount = 0;
        const dbErrors = [];
        await db_1.default.$transaction(async (tx) => {
            for (const student of studentsToInsert) {
                const existingNis = await tx.student.findUnique({ where: { nis: student.nis } });
                if (existingNis) {
                    throw new Error(`NIS '${student.nis}' is already registered in the system.`);
                }
                const existingNisn = await tx.student.findUnique({ where: { nisn: student.nisn } });
                if (existingNisn) {
                    throw new Error(`NISN '${student.nisn}' is already registered in the system.`);
                }
                await tx.student.create({ data: student });
                successCount++;
            }
        }).catch((err) => {
            dbErrors.push(err.message);
        });
        fs_1.default.unlinkSync(req.file.path);
        if (dbErrors.length > 0) {
            return res.status(400).json({ message: 'Import failed due to duplicate database entries', errors: dbErrors });
        }
        return res.status(200).json({
            message: `Successfully imported ${successCount} students.`,
        });
    }
    catch (error) {
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        next(error);
    }
};
exports.importStudents = importStudents;
