"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncToMysql = void 0;
const child_process_1 = require("child_process");
const client_mysql_1 = require("@prisma/client-mysql");
const db_1 = __importDefault(require("../db")); // The primary SQLite Prisma client
const syncToMysql = async () => {
    // Initialize MySQL Prisma Client
    // It reads DATABASE_URL from .env or environment by default.
    // Ensure that .env has DATABASE_URL set to MySQL connection string.
    // Wait, if SQLite uses DATABASE_URL, they will clash!
    // Let's explicitly pass the MySQL connection string or expect a separate env var.
    // For now, let's assume MYSQL_DATABASE_URL is used for XAMPP.
    const mysqlUrl = process.env.MYSQL_DATABASE_URL || 'mysql://root:@localhost:3306/db_nilai_madrasah';
    const mysqlPrisma = new client_mysql_1.PrismaClient({
        datasources: {
            db: {
                url: mysqlUrl,
            },
        },
    });
    try {
        console.log('[SYNC] Auto-creating database if not exists and resetting schema...');
        // This will force create the database and reset all tables to match schema.
        // We pass MYSQL_DATABASE_URL to ensure prisma picks it up.
        (0, child_process_1.execSync)('npx prisma db push --schema=prisma/schema.mysql.prisma --force-reset --skip-generate', {
            env: { ...process.env, DATABASE_URL: mysqlUrl },
            stdio: 'pipe', // Suppress output to prevent blocking
        });
    }
    catch (err) {
        console.log('[SYNC] Prisma db push failed or requires manual creation. Assuming it might exist.');
    }
    try {
        // 1. Test MySQL Connection
        await mysqlPrisma.$connect();
        console.log('[SYNC] Connected to MySQL successfully.');
        // 2. Fetch all data from SQLite
        console.log('[SYNC] Reading data from SQLite...');
        const tenants = await db_1.default.tenant.findMany();
        const users = await db_1.default.user.findMany();
        const activityLogs = await db_1.default.activityLog.findMany();
        const schoolProfiles = await db_1.default.schoolProfile.findMany();
        const academicYears = await db_1.default.academicYear.findMany();
        const students = await db_1.default.student.findMany();
        const subjects = await db_1.default.subject.findMany();
        const gradeWeights = await db_1.default.gradeWeight.findMany();
        const reportGrades = await db_1.default.reportGrade.findMany();
        const examGrades = await db_1.default.examGrade.findMany();
        // 3. Clear existing MySQL data (Skipped because --force-reset already cleared everything)
        const tenantIds = new Set(tenants.map(t => t.id));
        const userIds = new Set(users.map(u => u.id));
        const subjectIds = new Set(subjects.map(s => s.id));
        const studentIds = new Set(students.map(s => s.id));
        const yearIds = new Set(academicYears.map(y => y.id));
        const safeUsers = users.filter(u => tenantIds.has(u.tenantId));
        const safeActivityLogs = activityLogs.filter(l => tenantIds.has(l.tenantId)).map(log => ({
            ...log,
            userId: log.userId && userIds.has(log.userId) ? log.userId : null,
        }));
        const safeSchoolProfiles = schoolProfiles.filter(p => tenantIds.has(p.tenantId));
        const safeAcademicYears = academicYears.filter(y => tenantIds.has(y.tenantId));
        const safeStudents = students.filter(s => tenantIds.has(s.tenantId));
        const safeSubjects = subjects.filter(s => tenantIds.has(s.tenantId));
        const safeGradeWeights = gradeWeights.filter(w => tenantIds.has(w.tenantId) && yearIds.has(w.academicYearId));
        const safeReportGrades = reportGrades.filter(r => tenantIds.has(r.tenantId) && studentIds.has(r.studentId) && subjectIds.has(r.subjectId) && yearIds.has(r.academicYearId));
        const safeExamGrades = examGrades.filter(e => tenantIds.has(e.tenantId) && studentIds.has(e.studentId) && subjectIds.has(e.subjectId) && yearIds.has(e.academicYearId));
        // 4. Insert data to MySQL (in dependency order)
        console.log('[SYNC] Inserting data to MySQL...');
        await mysqlPrisma.$transaction([
            mysqlPrisma.tenant.createMany({ data: tenants }),
            mysqlPrisma.user.createMany({ data: safeUsers }),
            mysqlPrisma.activityLog.createMany({ data: safeActivityLogs }),
            mysqlPrisma.schoolProfile.createMany({ data: safeSchoolProfiles }),
            mysqlPrisma.academicYear.createMany({ data: safeAcademicYears }),
            mysqlPrisma.student.createMany({ data: safeStudents }),
            mysqlPrisma.subject.createMany({ data: safeSubjects }),
            mysqlPrisma.gradeWeight.createMany({ data: safeGradeWeights }),
            mysqlPrisma.reportGrade.createMany({ data: safeReportGrades }),
            mysqlPrisma.examGrade.createMany({ data: safeExamGrades }),
        ]);
        console.log('[SYNC] Synchronization to MySQL completed successfully.');
        return { success: true, message: 'Sinkronisasi berhasil!' };
    }
    catch (error) {
        console.error('[SYNC ERROR]', error);
        if (error.code === 'P1001') {
            return { success: false, message: 'MySQL XAMPP tidak aktif atau tidak dapat dijangkau.' };
        }
        return { success: false, message: 'Gagal melakukan sinkronisasi: ' + error.message };
    }
    finally {
        await mysqlPrisma.$disconnect();
    }
};
exports.syncToMysql = syncToMysql;
