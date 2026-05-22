import { PrismaClient } from '@prisma/client';
import { Role } from '../src/types/enums';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tenantsData = [
    { name: 'MI BUSTANUL HUDA 01 DAWUHAN', slug: 'mi-bustanul-huda-01-dawuhan', username: 'admin_dawuhan1' },
    { name: 'MI BUSTANUL HUDA 02 DAWUHAN', slug: 'mi-bustanul-huda-02-dawuhan', username: 'admin_dawuhan2' },
    { name: 'MI IKHSANIYAH', slug: 'mi-ikhsaniyah', username: 'admin_ikhsaniyah' },
  ];

  const password = await bcrypt.hash('Admin123!', 10);

  for (const data of tenantsData) {
    // Upsert tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: data.slug },
      update: { name: data.name },
      create: { name: data.name, slug: data.slug },
    });

    // Create School Profile
    await prisma.schoolProfile.upsert({
      where: { tenantId: tenant.id },
      update: { name: tenant.name },
      create: { tenantId: tenant.id, name: tenant.name, address: '-', headmaster: '-' },
    });

    // Create Admin User
    await prisma.user.upsert({
      where: { username: data.username },
      update: { role: Role.ADMIN },
      create: {
        tenantId: tenant.id,
        username: data.username,
        password: password,
        name: `Admin ${data.name}`,
        role: Role.ADMIN, // Admin role for specific school
      },
    });

    console.log(`Created Tenant: ${tenant.name}`);
    console.log(`  -> Username: ${data.username}`);
    console.log(`  -> Password: Admin123!`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
