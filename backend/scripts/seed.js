"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting database seeding...');
    // 1. Clear existing data in reverse order of relationships
    console.log('Cleaning up existing data...');
    await prisma.reportGrade.deleteMany();
    await prisma.examGrade.deleteMany();
    await prisma.gradeWeight.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.student.deleteMany();
    await prisma.academicYear.deleteMany();
    await prisma.schoolProfile.deleteMany();
    await prisma.user.deleteMany();
    // 2. Create default users
    console.log('Seeding default users...');
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const adminUser = await prisma.user.create({
        data: {
            username: 'admin',
            password: adminPassword,
            name: 'Administrator',
            role: client_1.Role.ADMIN,
        },
    });
    const guruPassword = await bcrypt.hash('Guru123!', 10);
    const guruUser = await prisma.user.create({
        data: {
            username: 'guru',
            password: guruPassword,
            name: 'Guru Wali Kelas',
            role: client_1.Role.GURU,
        },
    });
    const staffPassword = await bcrypt.hash('Staff123!', 10);
    const staffUser = await prisma.user.create({
        data: {
            username: 'staff',
            password: staffPassword,
            name: 'Staff Tata Usaha',
            role: client_1.Role.STAFF,
        },
    });
    console.log('Seeded users:', {
        admin: adminUser.username,
        guru: guruUser.username,
        staff: staffUser.username,
    });
    // 3. Create default School Profile
    console.log('Seeding school profile...');
    const schoolProfile = await prisma.schoolProfile.create({
        data: {
            name: 'MI Bustanul Huda Dawuhan',
            npsn: '20584321',
            address: 'Jl. Raya Dawuhan No. 45, Dawuhan, Kec. Grujugan, Kabupaten Bondowoso, Jawa Timur 68261',
            headmaster: 'H. Ahmad Syarifuddin, S.Pd.I.',
            headmasterNip: '197508122005011003',
            logoUrl: '',
        },
    });
    console.log('Seeded school profile:', schoolProfile.name);
    // 4. Create active Academic Year
    console.log('Seeding academic year...');
    const academicYear = await prisma.academicYear.create({
        data: {
            year: '2025/2026',
            semester: client_1.SemesterType.ODD,
            isActive: true,
        },
    });
    console.log('Seeded academic year:', `${academicYear.year} - ${academicYear.semester}`);
    // 5. Create default Grade Weight
    console.log('Seeding grade weight...');
    const gradeWeight = await prisma.gradeWeight.create({
        data: {
            reportPercentage: 60.0,
            examPercentage: 40.0,
            academicYearId: academicYear.id,
        },
    });
    console.log('Seeded grade weights:', `Report: ${gradeWeight.reportPercentage}%, Exam: ${gradeWeight.examPercentage}%`);
    // 6. Create default Subjects (Kelompok A, B, C)
    console.log('Seeding subjects...');
    const subjectsData = [
        // Kelompok A (Nasional)
        { name: 'Pendidikan Pancasila dan Kewarganegaraan', code: 'PPKN', group: client_1.SubjectGroup.KELOMPOK_A },
        { name: 'Bahasa Indonesia', code: 'BINDO', group: client_1.SubjectGroup.KELOMPOK_A },
        { name: 'Matematika', code: 'MTK', group: client_1.SubjectGroup.KELOMPOK_A },
        { name: 'Ilmu Pengetahuan Alam', code: 'IPA', group: client_1.SubjectGroup.KELOMPOK_A },
        { name: 'Ilmu Pengetahuan Sosial', code: 'IPS', group: client_1.SubjectGroup.KELOMPOK_A },
        // Kelompok B (Muatan Lokal / Umum)
        { name: 'Seni Budaya dan Prakarya', code: 'SBDP', group: client_1.SubjectGroup.KELOMPOK_B },
        { name: 'Pendidikan Jasmani Olahraga dan Kesehatan', code: 'PJOK', group: client_1.SubjectGroup.KELOMPOK_B },
        { name: 'Bahasa Daerah (Jawa/Madura)', code: 'BDER', group: client_1.SubjectGroup.KELOMPOK_B },
        // Kelompok C (Ciri Khas Madrasah)
        { name: 'Al-Qur\'an Hadits', code: 'ALQURAN_HADITS', group: client_1.SubjectGroup.KELOMPOK_C },
        { name: 'Akidah Akhlak', code: 'AKIDAH_AKHLAK', group: client_1.SubjectGroup.KELOMPOK_C },
        { name: 'Fikih', code: 'FIKIH', group: client_1.SubjectGroup.KELOMPOK_C },
        { name: 'Sejarah Kebudayaan Islam', code: 'SKI', group: client_1.SubjectGroup.KELOMPOK_C },
        { name: 'Bahasa Arab', code: 'BARAB', group: client_1.SubjectGroup.KELOMPOK_C },
    ];
    for (const sub of subjectsData) {
        await prisma.subject.create({
            data: sub,
        });
    }
    console.log(`Seeded ${subjectsData.length} subjects.`);
    console.log('Database seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
