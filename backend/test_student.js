const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findFirst({where: {username: 'admin_dawuhan1'}});
  const students = await prisma.student.findMany({where: {tenantId: user.tenantId}});
  console.log(students.length, 'total students');
  const active = await prisma.student.findMany({where: {tenantId: user.tenantId, isGraduated: false}});
  console.log(active.length, 'active students');
  const grad = await prisma.student.findMany({where: {tenantId: user.tenantId, isGraduated: true}});
  console.log(grad.length, 'graduated students');
}
check();
