import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Restoring data from backup.json...');
  
  if (!fs.existsSync('backup.json')) {
    console.error('backup.json not found!');
    process.exit(1);
  }

  const rawData = fs.readFileSync('backup.json', 'utf8');
  const data = JSON.parse(rawData);

  console.log('Creating default tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      name: 'MI Bustanul Huda Dawuhan',
      slug: 'mi-bustanul-huda',
    },
  });
  console.log(`Created tenant: ${tenant.name} (ID: ${tenant.id})`);

  console.log(`Restoring ${data.users?.length || 0} users...`);
  if (data.users && data.users.length > 0) {
    await prisma.user.createMany({
      data: data.users.map((u: any) => ({ ...u, tenantId: tenant.id })),
    });
  }

  console.log(`Restoring ${data.schoolProfiles?.length || 0} school profiles...`);
  if (data.schoolProfiles && data.schoolProfiles.length > 0) {
    await prisma.schoolProfile.createMany({
      data: data.schoolProfiles.map((p: any) => ({ ...p, tenantId: tenant.id })),
    });
  }

  console.log(`Restoring ${data.academicYears?.length || 0} academic years...`);
  if (data.academicYears && data.academicYears.length > 0) {
    await prisma.academicYear.createMany({
      data: data.academicYears.map((a: any) => ({ ...a, tenantId: tenant.id })),
    });
  }

  console.log(`Restoring ${data.students?.length || 0} students...`);
  if (data.students && data.students.length > 0) {
    await prisma.student.createMany({
      data: data.students.map((s: any) => ({ ...s, tenantId: tenant.id })),
    });
  }

  console.log(`Restoring ${data.subjects?.length || 0} subjects...`);
  if (data.subjects && data.subjects.length > 0) {
    await prisma.subject.createMany({
      data: data.subjects.map((s: any) => ({ ...s, tenantId: tenant.id })),
    });
  }

  console.log(`Restoring ${data.gradeWeights?.length || 0} grade weights...`);
  if (data.gradeWeights && data.gradeWeights.length > 0) {
    await prisma.gradeWeight.createMany({
      data: data.gradeWeights.map((gw: any) => ({ ...gw, tenantId: tenant.id })),
    });
  }

  console.log(`Restoring ${data.reportGrades?.length || 0} report grades...`);
  if (data.reportGrades && data.reportGrades.length > 0) {
    // createMany handles large arrays, but let's be careful if it's too big
    await prisma.reportGrade.createMany({
      data: data.reportGrades.map((rg: any) => ({ ...rg, tenantId: tenant.id })),
    });
  }

  console.log(`Restoring ${data.examGrades?.length || 0} exam grades...`);
  if (data.examGrades && data.examGrades.length > 0) {
    await prisma.examGrade.createMany({
      data: data.examGrades.map((eg: any) => ({ ...eg, tenantId: tenant.id })),
    });
  }

  console.log(`Restoring ${data.activityLogs?.length || 0} activity logs...`);
  if (data.activityLogs && data.activityLogs.length > 0) {
    await prisma.activityLog.createMany({
      data: data.activityLogs.map((log: any) => ({ ...log, tenantId: tenant.id })),
    });
  }

  console.log('Data restoration completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during restoration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
