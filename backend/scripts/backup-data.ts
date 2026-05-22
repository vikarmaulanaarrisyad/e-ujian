import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Backing up data...');
  const users = await prisma.user.findMany();
  const schoolProfiles = await prisma.schoolProfile.findMany();
  const academicYears = await prisma.academicYear.findMany();
  const students = await prisma.student.findMany();
  const subjects = await prisma.subject.findMany();
  const gradeWeights = await prisma.gradeWeight.findMany();
  const reportGrades = await prisma.reportGrade.findMany();
  const examGrades = await prisma.examGrade.findMany();
  const activityLogs = await prisma.activityLog.findMany();

  const data = {
    users,
    schoolProfiles,
    academicYears,
    students,
    subjects,
    gradeWeights,
    reportGrades,
    examGrades,
    activityLogs,
  };

  fs.writeFileSync('backup.json', JSON.stringify(data, null, 2));
  console.log('Backup completed: backup.json');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
