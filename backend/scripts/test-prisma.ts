import prisma, { tenantContext } from '../src/db';

async function main() {
  // Let's use MI 02's ID
  const tenantId = '222eef23-bc23-44eb-881e-37d0101c3095';

  await tenantContext.run(tenantId, async () => {
    const year = await prisma.academicYear.findFirst({
      where: { isActive: true }
    });
    console.log('Result:', year);
  });
}

main();
