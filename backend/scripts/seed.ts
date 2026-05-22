import { PrismaClient } from '@prisma/client';
import { Role, SubjectGroup, SemesterType } from '../src/types/enums';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clear existing data in reverse order of relationships
  console.log('Cleaning up existing data...');
  await prisma.activityLog.deleteMany();
  await prisma.reportGrade.deleteMany();
  await prisma.examGrade.deleteMany();
  await prisma.gradeWeight.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.schoolProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // 1.5 Create default Tenant
  console.log('Seeding default tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      name: 'MI Bustanul Huda Dawuhan',
      slug: 'mi-bustanul-huda',
    },
  });
  console.log(`Seeded tenant: ${tenant.name}`);

  // 2. Create default users
  console.log('Seeding default users...');
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      username: 'admin',
      password: adminPassword,
      name: 'Administrator',
      role: Role.ADMIN,
    },
  });

  const guruPassword = await bcrypt.hash('Guru123!', 10);
  const guruUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      username: 'guru',
      password: guruPassword,
      name: 'Guru Wali Kelas',
      role: Role.GURU,
    },
  });

  const staffPassword = await bcrypt.hash('Staff123!', 10);
  const staffUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      username: 'staff',
      password: staffPassword,
      name: 'Staff Tata Usaha',
      role: Role.STAFF,
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
      tenantId: tenant.id,
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
      tenantId: tenant.id,
      year: '2025/2026',
      semester: SemesterType.ODD,
      isActive: true,
    },
  });
  console.log('Seeded academic year:', `${academicYear.year} - ${academicYear.semester}`);

  // 5. Create default Grade Weight
  console.log('Seeding grade weight...');
  const gradeWeight = await prisma.gradeWeight.create({
    data: {
      tenantId: tenant.id,
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
    { tenantId: tenant.id, name: 'Pendidikan Pancasila dan Kewarganegaraan', code: 'PPKN', group: SubjectGroup.KELOMPOK_A, order: 1 },
    { tenantId: tenant.id, name: 'Bahasa Indonesia', code: 'BINDO', group: SubjectGroup.KELOMPOK_A, order: 2 },
    { tenantId: tenant.id, name: 'Matematika', code: 'MTK', group: SubjectGroup.KELOMPOK_A, order: 3 },
    { tenantId: tenant.id, name: 'Ilmu Pengetahuan Alam', code: 'IPA', group: SubjectGroup.KELOMPOK_A, order: 4 },
    { tenantId: tenant.id, name: 'Ilmu Pengetahuan Sosial', code: 'IPS', group: SubjectGroup.KELOMPOK_A, order: 5 },

    // Kelompok B (Muatan Lokal / Umum)
    { tenantId: tenant.id, name: 'Seni Budaya dan Prakarya', code: 'SBDP', group: SubjectGroup.KELOMPOK_B, order: 1 },
    { tenantId: tenant.id, name: 'Pendidikan Jasmani Olahraga dan Kesehatan', code: 'PJOK', group: SubjectGroup.KELOMPOK_B, order: 2 },
    { tenantId: tenant.id, name: 'Bahasa Daerah (Jawa/Madura)', code: 'BDER', group: SubjectGroup.KELOMPOK_B, order: 3 },

    // Kelompok C (Ciri Khas Madrasah)
    { tenantId: tenant.id, name: 'Al-Qur\'an Hadits', code: 'ALQURAN_HADITS', group: SubjectGroup.KELOMPOK_C, order: 1 },
    { tenantId: tenant.id, name: 'Akidah Akhlak', code: 'AKIDAH_AKHLAK', group: SubjectGroup.KELOMPOK_C, order: 2 },
    { tenantId: tenant.id, name: 'Fikih', code: 'FIKIH', group: SubjectGroup.KELOMPOK_C, order: 3 },
    { tenantId: tenant.id, name: 'Sejarah Kebudayaan Islam', code: 'SKI', group: SubjectGroup.KELOMPOK_C, order: 4 },
    { tenantId: tenant.id, name: 'Bahasa Arab', code: 'BARAB', group: SubjectGroup.KELOMPOK_C, order: 5 },
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

