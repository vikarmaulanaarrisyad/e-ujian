const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'grade.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace findMany that lack a where clause but have orderBy: { name: 'asc' }
// specifically for students in getReportGrades and getExamGrades.
content = content.replace(/const students = await prisma\.student\.findMany\(\{\s*orderBy: \{ name: 'asc' \},/g, "const students = await prisma.student.findMany({\n      where: { tenantId },\n      orderBy: { name: 'asc' },");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed missing where: { tenantId } in getReportGrades and getExamGrades.');
