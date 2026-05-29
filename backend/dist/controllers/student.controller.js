"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveStudents = exports.uploadPhotos = exports.batchAssignSklNumbers = exports.batchUpdateGraduation = exports.updateGraduationStatus = exports.importStudents = exports.exportStudents = exports.getStudentTemplate = exports.deleteStudent = exports.updateStudent = exports.createStudent = exports.getStudentById = exports.getAllStudents = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
const db_1 = __importDefault(require("../db"));
const student_validator_1 = require("../validators/student.validator");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const activityLog_1 = require("../lib/activityLog");
// Get all students
const getAllStudents = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
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
        // Alumni filter
        const isAlumniParam = req.query.alumni === 'true';
        filter.isAlumni = isAlumniParam;
        filter.tenantId = tenantId;
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
        const tenantId = req.user.tenantId;
        const { id } = req.params;
        const student = await db_1.default.student.findUnique({
            where: { id, tenantId },
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
        const tenantId = req.user.tenantId;
        const validation = student_validator_1.createStudentSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: 'Validation error',
                errors: validation.error.flatten().fieldErrors,
            });
        }
        const { nis, nisn } = validation.data;
        const existingNis = await db_1.default.student.findFirst({ where: { nis, tenantId } });
        if (existingNis) {
            return res.status(400).json({ message: 'NIS already registered' });
        }
        const existingNisn = await db_1.default.student.findFirst({ where: { nisn, tenantId } });
        if (existingNisn) {
            return res.status(400).json({ message: 'NISN already registered' });
        }
        const student = await db_1.default.student.create({
            data: { ...validation.data, tenantId },
        });
        (0, activityLog_1.logActivity)({ req, action: 'CREATE_STUDENT', entity: 'Student', entityId: student.id, description: `Menambahkan siswa baru: ${student.name} (NIS: ${student.nis})` });
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
        const tenantId = req.user.tenantId;
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
            const existingNis = await db_1.default.student.findFirst({ where: { nis, tenantId } });
            if (existingNis) {
                return res.status(400).json({ message: 'NIS already registered' });
            }
        }
        if (nisn && nisn !== student.nisn) {
            const existingNisn = await db_1.default.student.findFirst({ where: { nisn, tenantId } });
            if (existingNisn) {
                return res.status(400).json({ message: 'NISN already registered' });
            }
        }
        const updatedStudent = await db_1.default.student.update({
            where: { id, tenantId },
            data: { ...validation.data, tenantId },
        });
        (0, activityLog_1.logActivity)({ req, action: 'UPDATE_STUDENT', entity: 'Student', entityId: id, description: `Memperbarui data siswa: ${student.name} (NIS: ${student.nis})` });
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
        const tenantId = req.user.tenantId;
        const { id } = req.params;
        const student = await db_1.default.student.findUnique({ where: { id } });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        await db_1.default.student.delete({
            where: { id, tenantId },
        });
        (0, activityLog_1.logActivity)({ req, action: 'DELETE_STUDENT', entity: 'Student', entityId: id, description: `Menghapus data siswa: ${student.name} (NIS: ${student.nis})` });
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
        const tenantId = req.user.tenantId;
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
        const tenantId = req.user.tenantId;
        const students = await db_1.default.student.findMany({
            where: { tenantId },
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
        const tenantId = req.user.tenantId;
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
                const existingNis = await tx.student.findFirst({ where: { nis: student.nis, tenantId } });
                if (existingNis) {
                    throw new Error(`NIS '${student.nis}' is already registered in the system.`);
                }
                const existingNisn = await tx.student.findFirst({ where: { nisn: student.nisn, tenantId } });
                if (existingNisn) {
                    throw new Error(`NISN '${student.nisn}' is already registered in the system.`);
                }
                await tx.student.create({ data: { ...student, tenantId } });
                successCount++;
            }
        }).catch((err) => {
            dbErrors.push(err.message);
        });
        fs_1.default.unlinkSync(req.file.path);
        if (dbErrors.length > 0) {
            return res.status(400).json({ message: 'Import failed due to duplicate database entries', errors: dbErrors });
        }
        (0, activityLog_1.logActivity)({ req, action: 'IMPORT_STUDENTS', entity: 'Student', description: `Mengimpor ${successCount} data siswa dari Excel` });
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
// Update graduation status
const updateGraduationStatus = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const { id } = req.params;
        const { isGraduated, graduationDate, certificateNumber } = req.body;
        const student = await db_1.default.student.findUnique({ where: { id } });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        if (certificateNumber && certificateNumber !== student.certificateNumber) {
            const existing = await db_1.default.student.findFirst({ where: { certificateNumber, tenantId } });
            if (existing) {
                return res.status(400).json({ message: 'Nomor seri ijazah sudah digunakan oleh siswa lain.' });
            }
        }
        const updated = await db_1.default.student.update({
            where: { id, tenantId },
            data: {
                isGraduated,
                graduationDate: graduationDate ? new Date(graduationDate) : null,
                certificateNumber: certificateNumber || null,
            },
        });
        (0, activityLog_1.logActivity)({ req, action: 'UPDATE_GRADUATION', entity: 'Student', entityId: id, description: `Memperbarui status kelulusan ${student.name}: ${isGraduated ? 'Lulus' : 'Tidak Lulus'}` });
        return res.status(200).json({ message: 'Status kelulusan diperbarui', student: updated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateGraduationStatus = updateGraduationStatus;
// Batch update graduation status
const batchUpdateGraduation = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const { studentIds, isGraduated, graduationDate } = req.body;
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'Daftar ID siswa tidak valid.' });
        }
        await db_1.default.student.updateMany({
            where: { id: { in: studentIds }, tenantId },
            data: {
                isGraduated,
                graduationDate: graduationDate ? new Date(graduationDate) : null,
            },
        });
        (0, activityLog_1.logActivity)({ req, action: 'BATCH_UPDATE_GRADUATION', entity: 'Student', description: `Batch update kelulusan ${studentIds.length} siswa menjadi: ${isGraduated ? 'Lulus' : 'Tidak Lulus'}` });
        return res.status(200).json({ message: `${studentIds.length} siswa berhasil diperbarui status kelulusannya.` });
    }
    catch (error) {
        next(error);
    }
};
exports.batchUpdateGraduation = batchUpdateGraduation;
// Batch assign SKL numbers to all graduated students
const batchAssignSklNumbers = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const { format, overwrite } = req.body;
        // format: e.g. "B.{seq}/MI.BH/{year}" — if not provided, use school profile format
        // overwrite: boolean — if true, reassign even if student already has a sklNumber
        // Get school profile for default format
        const profile = await db_1.default.schoolProfile.findUnique({ where: { tenantId } });
        const numberFormat = format || profile?.sklNumberFormat || 'B.{seq}/MI.BH/{year}';
        // Fetch all graduated students ordered by name
        const students = await db_1.default.student.findMany({
            where: { isGraduated: true, tenantId },
            orderBy: { name: 'asc' },
        });
        if (students.length === 0) {
            return res.status(400).json({ message: 'Tidak ada siswa yang berstatus lulus.' });
        }
        // Filter students that need SKL number
        const toAssign = overwrite
            ? students
            : students.filter(s => !s.sklNumber);
        if (toAssign.length === 0) {
            return res.status(200).json({
                message: 'Semua siswa lulus sudah memiliki nomor SKL. Gunakan opsi "Timpa" untuk meng-assign ulang.',
                assigned: 0,
            });
        }
        // Generate numbers sequentially
        // Find the starting sequence — skip students that already have numbers
        // so existing students get lower numbers than new ones
        let seqCounter = 1;
        const updates = [];
        for (const student of toAssign) {
            const year = student.graduationDate
                ? new Date(student.graduationDate).getFullYear()
                : new Date().getFullYear();
            const seq = String(seqCounter).padStart(3, '0');
            const sklNumber = numberFormat
                .replace('{seq}', seq)
                .replace('{year}', String(year));
            updates.push({ id: student.id, sklNumber });
            seqCounter++;
        }
        // Apply in transaction
        await db_1.default.$transaction(updates.map(u => db_1.default.student.update({
            where: { id: u.id },
            data: { sklNumber: u.sklNumber },
        })));
        (0, activityLog_1.logActivity)({ req, action: 'ASSIGN_SKL_NUMBERS', entity: 'Student', description: `Meng-assign ${updates.length} nomor SKL dengan format: ${numberFormat}`, metadata: { assigned: updates.length, format: numberFormat } });
        return res.status(200).json({
            message: `Berhasil meng-assign ${updates.length} nomor SKL.`,
            assigned: updates.length,
            format: numberFormat,
            preview: updates.slice(0, 3).map(u => u.sklNumber),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.batchAssignSklNumbers = batchAssignSklNumbers;
// Upload photos via ZIP
const uploadPhotos = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        if (!req.file) {
            return res.status(400).json({ message: 'Tidak ada file ZIP yang diunggah.' });
        }
        if (req.file.mimetype !== 'application/zip' && req.file.mimetype !== 'application/x-zip-compressed' && !req.file.originalname.endsWith('.zip')) {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'File harus berformat .zip' });
        }
        const zipFilePath = req.file.path;
        const extractDir = path_1.default.join(process.cwd(), 'public', 'uploads', 'photos');
        // Ensure photos directory exists
        if (!fs_1.default.existsSync(extractDir)) {
            fs_1.default.mkdirSync(extractDir, { recursive: true });
        }
        const zip = new adm_zip_1.default(zipFilePath);
        const zipEntries = zip.getEntries();
        let successCount = 0;
        const errors = [];
        // Valid image extensions
        const validExts = ['.jpg', '.jpeg', '.png'];
        for (const zipEntry of zipEntries) {
            if (zipEntry.isDirectory)
                continue;
            const fileName = zipEntry.entryName;
            // Skip hidden files or macOS __MACOSX folders
            if (fileName.startsWith('__MACOSX') || fileName.includes('/._') || fileName.split('/').pop()?.startsWith('.'))
                continue;
            const ext = path_1.default.extname(fileName).toLowerCase();
            if (!validExts.includes(ext))
                continue;
            // Extract the filename without extension (this should be the NISN)
            const baseName = path_1.default.basename(fileName, ext);
            const nisn = baseName.trim();
            if (!nisn)
                continue;
            // Check if student with this NISN exists
            const student = await db_1.default.student.findFirst({ where: { nisn, tenantId } });
            if (!student) {
                errors.push(`NISN ${nisn} tidak ditemukan di database (${fileName}).`);
                continue;
            }
            // Save the photo as {studentId}{ext}
            const newFileName = `${student.id}${ext}`;
            const destPath = path_1.default.join(extractDir, newFileName);
            // Extract entry to buffer and save
            const fileData = zipEntry.getData();
            fs_1.default.writeFileSync(destPath, fileData);
            // Update student photoUrl in DB
            const photoUrl = `/uploads/photos/${newFileName}`;
            await db_1.default.student.update({
                where: { id: student.id },
                data: { photoUrl },
            });
            successCount++;
        }
        // Delete uploaded ZIP
        fs_1.default.unlinkSync(zipFilePath);
        return res.status(200).json({
            message: `Berhasil memproses ${successCount} foto.`,
            successCount,
            errors: errors.length > 0 ? errors : undefined,
        });
    }
    catch (error) {
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        next(error);
    }
};
exports.uploadPhotos = uploadPhotos;
// Archive graduated students to Alumni
const archiveStudents = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        // Cari siswa yang sudah lulus tapi belum jadi alumni
        const graduatedStudents = await db_1.default.student.findMany({
            where: {
                isGraduated: true,
                isAlumni: false,
                tenantId,
            },
        });
        if (graduatedStudents.length === 0) {
            return res.status(400).json({ message: 'Tidak ada siswa lulus yang bisa diarsipkan.' });
        }
        // Dapatkan tahun ajaran aktif untuk label alumni
        const activeYearRecord = await db_1.default.academicYear.findFirst({ where: { isActive: true, tenantId } });
        const alumniYearStr = activeYearRecord ? activeYearRecord.year : new Date().getFullYear().toString();
        // Lakukan pemindahan secara massal
        const result = await db_1.default.student.updateMany({
            where: {
                isGraduated: true,
                isAlumni: false,
                tenantId,
            },
            data: {
                isAlumni: true,
                alumniYear: alumniYearStr,
            },
        });
        return res.status(200).json({
            message: `Berhasil mengarsipkan ${result.count} siswa ke Data Alumni.`,
            archivedCount: result.count,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.archiveStudents = archiveStudents;
