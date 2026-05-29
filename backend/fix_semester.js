const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: {
      name: {
        contains: 'ikhsaniyah'
      }
    },
    include: {
      academicYears: true
    }
  });

  for (const tenant of tenants) {
    if (tenant.academicYears.length > 0) {
      const year = tenant.academicYears[0];
      await prisma.academicYear.update({
        where: { id: year.id },
        data: { semester: 'EVEN' }
      });
      console.log(`Updated semester to EVEN for ${tenant.name}`);
    }
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
