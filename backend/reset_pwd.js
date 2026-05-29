const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const username = 'admin_dawuhan1';
  const newPassword = 'password123';
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { username },
    data: { password: passwordHash }
  });

  console.log(`Password for ${username} reset successfully to: ${newPassword}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
