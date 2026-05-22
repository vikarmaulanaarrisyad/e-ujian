import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantId = '4cbebca9-c233-43ad-9d5b-860dab240424'; // MI Bustanul Huda
  try {
    const res = await prisma.subject.findFirst({
      where: { code: 'PAI', tenantId },
    });
    console.log('findFirst with code+tenantId:', !!res);
  } catch (e: any) {
    console.log('findFirst error:', e.message);
  }

  try {
    const res = await prisma.subject.findUnique({
      where: { code: 'PAI', tenantId } as any, // Trying to pass flattened compound key
    });
    console.log('findUnique with flat code+tenantId:', !!res);
  } catch (e: any) {
    console.log('findUnique flat error:', e.message);
  }

  try {
    const res = await prisma.subject.findUnique({
      where: { tenantId_code: { code: 'PAI', tenantId } }, 
    });
    console.log('findUnique with compound object:', !!res);
  } catch (e: any) {
    console.log('findUnique compound error:', e.message);
  }
}

main().finally(() => prisma.$disconnect());
