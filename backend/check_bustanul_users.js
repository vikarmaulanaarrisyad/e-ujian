const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: {
      name: {
        contains: 'bustanul huda 01',
      }
    },
    include: {
      users: {
        select: {
          id: true,
          username: true,
          role: true,
          name: true,
        }
      }
    }
  });

  console.log(JSON.stringify(tenants, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
