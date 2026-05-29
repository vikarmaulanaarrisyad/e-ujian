const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const t1 = await prisma.tenant.findFirst({ where: { name: 'MI BUSTANUL HUDA 01 DAWUHAN' }});
  const t2 = await prisma.tenant.findFirst({ where: { name: 'MI BUSTANUL HUDA 02 DAWUHAN' }});
  
  if (!t1 || !t2) return console.log('Tenants not found');

  const subjects1 = await prisma.subject.findMany({ where: { tenantId: t1.id }});
  const subjects2 = await prisma.subject.findMany({ where: { tenantId: t2.id }});
  
  if (subjects2.length === 0 && subjects1.length > 0) {
    console.log(`Copying ${subjects1.length} subjects to T2...`);
    const data = subjects1.map(s => ({
      tenantId: t2.id,
      name: s.name,
      code: s.code,
      group: s.group,
      order: s.order
    }));
    await prisma.subject.createMany({ data });
    console.log('Successfully copied subjects.');
  } else {
    console.log('T2 already has subjects or T1 has none.');
  }
}
run().finally(() => prisma.$disconnect());
