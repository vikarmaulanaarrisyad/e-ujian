import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Emptying data for MI 02...');
  
  // Get destination tenant
  const destTenant = await prisma.tenant.findUnique({
    where: { slug: 'mi-02' }
  });

  if (!destTenant) {
    console.log('MI 02 not found');
    return;
  }

  const tenantId = destTenant.id;

  // Delete all students. This will cascade and delete ReportGrades and ExamGrades.
  const result = await prisma.student.deleteMany({
    where: { tenantId }
  });
  
  console.log(`Deleted ${result.count} students (and all their cascaded grades) from MI 02.`);

  console.log('Done!');
}

main();
