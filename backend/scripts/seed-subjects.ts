import { PrismaClient, SubjectGroup } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding standard subjects...');
  
  const tenants = await prisma.tenant.findMany({
    where: { slug: { not: 'system' } }
  });

  const subjects = [
    // KELOMPOK A
    { name: "Al-Qur'an Hadis", code: 'QH', group: SubjectGroup.KELOMPOK_A },
    { name: 'Akidah Akhlak', code: 'AA', group: SubjectGroup.KELOMPOK_A },
    { name: 'Fikih', code: 'FIK', group: SubjectGroup.KELOMPOK_A },
    { name: 'Sejarah Kebudayaan Islam', code: 'SKI', group: SubjectGroup.KELOMPOK_A },
    { name: 'Pendidikan Pancasila dan Kewarganegaraan', code: 'PPKN', group: SubjectGroup.KELOMPOK_A },
    { name: 'Bahasa Indonesia', code: 'BIND', group: SubjectGroup.KELOMPOK_A },
    { name: 'Bahasa Arab', code: 'BARB', group: SubjectGroup.KELOMPOK_A },
    { name: 'Matematika', code: 'MTK', group: SubjectGroup.KELOMPOK_A },
    { name: 'Ilmu Pengetahuan Alam', code: 'IPA', group: SubjectGroup.KELOMPOK_A },
    { name: 'Ilmu Pengetahuan Sosial', code: 'IPS', group: SubjectGroup.KELOMPOK_A },
    // KELOMPOK B
    { name: 'Seni Budaya dan Prakarya', code: 'SBDP', group: SubjectGroup.KELOMPOK_B },
    { name: 'Pendidikan Jasmani, Olahraga dan Kesehatan', code: 'PJOK', group: SubjectGroup.KELOMPOK_B },
    { name: 'Bahasa Jawa', code: 'BJAWA', group: SubjectGroup.KELOMPOK_B },
  ];

  for (const tenant of tenants) {
    console.log(`Seeding subjects for ${tenant.name}...`);
    
    // Check if subjects already exist
    const existing = await prisma.subject.count({ where: { tenantId: tenant.id } });
    if (existing > 0) {
      console.log(`- ${tenant.name} already has ${existing} subjects. Skipping.`);
      continue;
    }

    let order = 1;
    for (const sub of subjects) {
      await prisma.subject.create({
        data: {
          tenantId: tenant.id,
          name: sub.name,
          code: sub.code,
          group: sub.group,
          order: order++
        }
      });
    }
  }

  console.log('Done!');
}

main();
