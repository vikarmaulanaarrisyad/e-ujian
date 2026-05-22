import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting all non-system tenants...');
  
  const tenants = await prisma.tenant.findMany({
    where: { slug: { not: 'system' } }
  });

  for (const tenant of tenants) {
    console.log(`Deleting ${tenant.name} (${tenant.slug})...`);
    await prisma.tenant.delete({
      where: { id: tenant.id }
    });
  }

  console.log('All non-system tenants deleted successfully!');
  console.log('Database has been completely reset to pristine state (System Admin only).');
}

main();
