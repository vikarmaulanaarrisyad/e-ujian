import { PrismaClient } from '@prisma/client';
import { Role } from '../src/types/enums';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('No tenant found. Please seed the database first.');
    return;
  }

  const password = await bcrypt.hash('SuperAdmin123!', 10);
  const user = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      tenantId: tenant.id,
      username: 'superadmin',
      password: password,
      name: 'Super Administrator',
      role: Role.SUPER_ADMIN,
    },
  });

  console.log(`Created Super Admin user: ${user.username} with password: SuperAdmin123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
