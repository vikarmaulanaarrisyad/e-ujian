const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find all tenants that don't have any active academic years
  const tenants = await prisma.tenant.findMany({
    include: {
      academicYears: true
    }
  });

  for (const tenant of tenants) {
    if (tenant.academicYears.length === 0) {
      console.log(`Tenant ${tenant.name} has NO academic years. Creating default...`);
      
      const academicYear = await prisma.academicYear.create({
        data: {
          tenantId: tenant.id,
          year: '2025/2026',
          semester: 'ODD',
          isActive: true,
        }
      });

      await prisma.gradeWeight.create({
        data: {
          tenantId: tenant.id,
          academicYearId: academicYear.id,
          reportPercentage: 60.0,
          examPercentage: 40.0,
        }
      });
      console.log(`-> Created active academic year 2025/2026 for ${tenant.name}`);
    } else {
      // Check if any is active
      const hasActive = tenant.academicYears.some(ay => ay.isActive);
      if (!hasActive) {
        console.log(`Tenant ${tenant.name} has academic years but NONE are active. Activating the first one...`);
        const first = tenant.academicYears[0];
        await prisma.academicYear.update({
          where: { id: first.id },
          data: { isActive: true }
        });
        console.log(`-> Activated ${first.year} - ${first.semester} for ${tenant.name}`);
      }
    }
  }

  console.log("Database sync complete!");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
