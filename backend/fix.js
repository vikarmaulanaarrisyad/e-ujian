const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'grade.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/where:\s*{\s*isAlumni:\s*false\s*}/g, 'where: { isAlumni: false, tenantId }');
content = content.replace(/prisma\.subject\.findMany\(\s*{\s*(orderBy|select)/g, 'prisma.subject.findMany({ where: { tenantId }, $1');
content = content.replace(/prisma\.subject\.findMany\(\)/g, 'prisma.subject.findMany({ where: { tenantId } })');
content = content.replace(/prisma\.reportGrade\.findMany\(\s*{\s*where:\s*{\s*academicYearId/g, 'prisma.reportGrade.findMany({ where: { tenantId, academicYearId');
content = content.replace(/prisma\.examGrade\.findMany\(\s*{\s*where:\s*{\s*academicYearId/g, 'prisma.examGrade.findMany({ where: { tenantId, academicYearId');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed tenantId in findMany calls.');
