import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('--- USERS IN DATABASE ---');
    console.log(users.map(u => ({ id: u.id, username: u.username, role: u.role, name: u.name })));
    console.log('-------------------------');
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
