import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Padding NIS and NISN to 10 digits for all existing students...');
  const students = await prisma.student.findMany();
  
  let count = 0;
  for (const student of students) {
    const paddedNis = student.nis.padStart(10, '0');
    const paddedNisn = student.nisn.padStart(10, '0');
    
    if (paddedNis !== student.nis || paddedNisn !== student.nisn) {
      await prisma.student.update({
        where: { id: student.id },
        data: {
          nis: paddedNis,
          nisn: paddedNisn,
        }
      });
      count++;
    }
  }
  
  console.log(`Successfully padded ${count} students.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
