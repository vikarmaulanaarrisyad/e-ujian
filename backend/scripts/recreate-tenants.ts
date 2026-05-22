import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Recreating tenants...');

  const tenantsData = [
    { name: 'MI 01', slug: 'mi-01', username: 'admin_mi01' },
    { name: 'MI 02', slug: 'mi-02', username: 'admin_mi02' },
    { name: 'MI Bustanul Huda Dawuhan', slug: 'mi-bustanul-huda', username: 'admin_bustanul' },
  ];

  const defaultPassword = await bcrypt.hash('admin123', 10);

  for (const t of tenantsData) {
    console.log(`Recreating ${t.name}...`);
    await prisma.tenant.create({
      data: {
        name: t.name,
        slug: t.slug,
        schoolProfiles: {
          create: {
            name: t.name,
            address: '-',
            headmaster: '-',
          }
        },
        users: {
          create: {
            username: t.username,
            password: defaultPassword,
            name: `Admin ${t.name}`,
            role: 'ADMIN',
          }
        }
      }
    });
  }

  console.log('Done!');
}

main();
