import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding super admin...');

  const passwordHash = await bcrypt.hash('superadmin123', 10);

  // We need a dummy tenant for SUPER_ADMIN, or we can use the default tenant "mi-bustanul-huda-dawuhan".
  // Actually, SUPER_ADMIN shouldn't really be bound to a tenant logically, but our schema requires a tenantId.
  // Let's attach it to MI Bustanul Huda for now, or create a 'system' tenant.
  // We'll create a System tenant to be clean.
  
  const systemTenant = await prisma.tenant.upsert({
    where: { slug: 'system' },
    update: {},
    create: {
      name: 'System Administration',
      slug: 'system',
    },
  });

  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {
      role: 'SUPER_ADMIN' as any
    },
    create: {
      tenantId: systemTenant.id,
      username: 'superadmin',
      password: passwordHash,
      name: 'System Super Admin',
      role: 'SUPER_ADMIN' as any,
    },
  });

  console.log('Super Admin seeded! Username: superadmin, Password: superadmin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
