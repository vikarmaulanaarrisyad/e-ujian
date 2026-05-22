const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'grade.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/let profile: any = await prisma\.schoolProfile\.findFirst\(\);/g, 'let profile: any = await prisma.schoolProfile.findUnique({ where: { tenantId }, include: { tenant: true } });');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed schoolProfile in getGradeRecap.');
