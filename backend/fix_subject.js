const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'subject.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Inject tenantId if missing in controllers
content = content.replace(/(export const \w+ = async \(req: Request, res: Response, next: NextFunction\) => {\s*try {\s*)(?!const tenantId)/g, '$1const tenantId = (req as any).user.tenantId;\n    ');

// Add tenantId to findMany and findUnique and create and update
content = content.replace(/prisma\.subject\.findMany\(\{\s*orderBy:/g, 'prisma.subject.findMany({\n      where: { tenantId },\n      orderBy:');
content = content.replace(/where: { id },/g, 'where: { id, tenantId },');
content = content.replace(/where: { code: validation\.data\.code }/g, 'where: { code: validation.data.code, tenantId }');
content = content.replace(/data: validation\.data,/g, 'data: { ...validation.data, tenantId },');

// Fix the importSubjects
content = content.replace(/const existingSubjects = await prisma\.subject\.findMany\(\{ select: \{ code: true \} \}\);/g, 'const existingSubjects = await prisma.subject.findMany({ where: { tenantId }, select: { code: true } });');
content = content.replace(/await \(tx\.subject\.create as any\)\(\{ data: subject \}\);/g, 'await (tx.subject.create as any)({ data: { ...subject, tenantId } });');

// Add a new endpoint for generating default subjects at the end of the file
const generateDefaultCode = `
// Generate default subjects
export const generateDefaultSubjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user.tenantId;
    
    // Check if any subject exists
    const existing = await prisma.subject.findFirst({ where: { tenantId } });
    if (existing) {
      return res.status(400).json({ message: 'Mata pelajaran sudah ada. Tidak dapat generate data default.' });
    }

    const defaultSubjects = [
      { code: 'QH', name: "Al-Qur'an Hadis", group: 'KELOMPOK_A', order: 1 },
      { code: 'AA', name: 'Akidah Akhlak', group: 'KELOMPOK_A', order: 2 },
      { code: 'FIK', name: 'Fikih', group: 'KELOMPOK_A', order: 3 },
      { code: 'SKI', name: 'Sejarah Kebudayaan Islam', group: 'KELOMPOK_A', order: 4 },
      { code: 'PKN', name: 'Pendidikan Pancasila dan Kewarganegaraan', group: 'KELOMPOK_A', order: 5 },
      { code: 'BIN', name: 'Bahasa Indonesia', group: 'KELOMPOK_A', order: 6 },
      { code: 'BAR', name: 'Bahasa Arab', group: 'KELOMPOK_A', order: 7 },
      { code: 'MTK', name: 'Matematika', group: 'KELOMPOK_A', order: 8 },
      { code: 'IPA', name: 'Ilmu Pengetahuan Alam', group: 'KELOMPOK_A', order: 9 },
      { code: 'IPS', name: 'Ilmu Pengetahuan Sosial', group: 'KELOMPOK_A', order: 10 },
      { code: 'SBDP', name: 'Seni Budaya dan Prakarya', group: 'KELOMPOK_B', order: 1 },
      { code: 'PJOK', name: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', group: 'KELOMPOK_B', order: 2 },
      { code: 'MULOK1', name: 'Muatan Lokal 1', group: 'KELOMPOK_C', order: 1 },
      { code: 'MULOK2', name: 'Muatan Lokal 2', group: 'KELOMPOK_C', order: 2 },
    ];

    await prisma.$transaction(
      defaultSubjects.map((sub) =>
        (prisma.subject.create as any)({
          data: { ...sub, tenantId },
        })
      )
    );

    return res.status(201).json({ message: 'Default subjects generated successfully' });
  } catch (error) {
    next(error);
  }
};
`;

if (!content.includes('generateDefaultSubjects')) {
  content += generateDefaultCode;
}

fs.writeFileSync(filePath, content, 'utf8');

// Now update the router
const routerPath = path.join(__dirname, 'src', 'routes', 'subject.routes.ts');
let routerContent = fs.readFileSync(routerPath, 'utf8');
if (!routerContent.includes('generateDefaultSubjects')) {
  routerContent = routerContent.replace(/import {([^}]+)} from '\.\.\/controllers\/subject\.controller';/, "import {$1, generateDefaultSubjects } from '../controllers/subject.controller';");
  routerContent = routerContent.replace(/router\.post\('\/import',/, "router.post('/generate-default', requireRole('SUPER_ADMIN'), generateDefaultSubjects);\n\nrouter.post('/import',");
  fs.writeFileSync(routerPath, routerContent, 'utf8');
}

console.log('Fixed subject controller and added generateDefaultSubjects');
