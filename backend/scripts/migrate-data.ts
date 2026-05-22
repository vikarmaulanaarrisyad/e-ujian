import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration to default tenant...');

  // 1. Create or get default tenant
  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'mi-bustanul-huda' },
  });

  if (!tenant) {
    console.log('Creating default tenant...');
    tenant = await prisma.tenant.create({
      data: {
        name: 'MI Bustanul Huda Dawuhan',
        slug: 'mi-bustanul-huda',
      },
    });
  }
  
  console.log(`Using Tenant ID: ${tenant.id}`);

  // 2. Update all records that don't have a tenantId
  console.log('Updating Users...');
  await prisma.user.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });

  console.log('Updating SchoolProfiles...');
  await prisma.schoolProfile.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });

  console.log('Updating AcademicYears...');
  await prisma.academicYear.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });

  console.log('Updating Students...');
  await prisma.student.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });

  console.log('Updating Subjects...');
  await prisma.subject.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });

  console.log('Updating GradeWeights...');
  await prisma.gradeWeight.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });

  console.log('Updating ReportGrades...');
  await prisma.reportGrade.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });

  console.log('Updating ExamGrades...');
  await prisma.examGrade.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });

  console.log('Updating ActivityLogs...');
  await prisma.activityLog.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });

  console.log('Data migration completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
