const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { username: 'admin_dawuhan1' },
  });
  if (user) {
    console.log('Found user:', user.username);
    console.log('Password Hash:', user.password);
    // Let's test a common password 'password', '123456', etc.
    const isMatch = await bcrypt.compare('123456', user.password);
    console.log('Is 123456?', isMatch);
    
    // We can also just update it to something known to tell the user:
    // await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash('password123', 10) } });
    // console.log('Reset password to: password123');
  } else {
    console.log('User admin_dawuhan1 not found');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
