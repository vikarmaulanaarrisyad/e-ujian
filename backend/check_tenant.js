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

  const exactTenant = await prisma.tenant.findMany({
    include: {
      academicYears: true
    }
  });

  console.log("Filtered:", JSON.stringify(tenants, null, 2));
  console.log("All tenants:", exactTenant.map(t => t.name));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
