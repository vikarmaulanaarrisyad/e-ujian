const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const grades = await prisma.examGrade.findMany();
  let nans = 0;
  for (const g of grades) {
    if (isNaN(g.score) || g.score === null || g.score === undefined) {
      console.log('Bad score:', g);
      nans++;
    }
  }
  console.log('Total bad scores:', nans);
}
main().finally(() => prisma.$disconnect());
