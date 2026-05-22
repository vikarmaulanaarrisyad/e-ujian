import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const subjects = await prisma.subject.findMany();
  for (const sub of subjects) {
    let newGroup = 'KELOMPOK_A';
    const raw = sub.group ? sub.group.toUpperCase() : '';
    if (raw.includes('B')) {
      newGroup = 'KELOMPOK_B';
    } else if (raw.includes('C')) {
      newGroup = 'KELOMPOK_C';
    }

    if (sub.group !== newGroup) {
      await prisma.subject.update({
        where: { id: sub.id },
        data: { group: newGroup }
      });
      console.log(`Updated ${sub.name}: ${sub.group} -> ${newGroup}`);
    }
  }
}

main()
  .then(() => console.log('Done'))
  .finally(() => prisma.$disconnect());
