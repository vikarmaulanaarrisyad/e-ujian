import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating manual indexes to satisfy MySQL foreign keys...');
  
  try {
    await prisma.$executeRawUnsafe(`CREATE INDEX exam_grades_student_id_idx ON exam_grades(student_id);`);
    console.log('Created index exam_grades_student_id_idx');
  } catch(e: any) { console.log('Index already exists or error:', e.message); }

  try {
    await prisma.$executeRawUnsafe(`CREATE INDEX report_grades_student_id_idx ON report_grades(student_id);`);
    console.log('Created index report_grades_student_id_idx');
  } catch(e: any) { console.log('Index already exists or error:', e.message); }

  console.log('Indexes creation completed.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
