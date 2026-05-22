const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'document.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Add tenantId to getStudentDocumentData
content = content.replace(/const { id } = req.params;/, 'const { id } = req.params;\n    const tenantId = (req as any).user.tenantId;');
// Add tenantId to activeYear
content = content.replace(/const activeYear = await prisma\.academicYear\.findFirst\(\{\s*where: \{ isActive: true \},/g, 'const activeYear = await prisma.academicYear.findFirst({\n      where: { isActive: true, tenantId },');
// Add tenantId to schoolProfile
content = content.replace(/let profile: any = await prisma\.schoolProfile\.findFirst\(\) \|\| defaultProfile\(\);/g, 'let profile: any = await prisma.schoolProfile.findUnique({ where: { tenantId }, include: { tenant: true } }) || defaultProfile();');
// Add tenantId to subjects
content = content.replace(/const subjects = await prisma\.subject\.findMany\(\{\s*orderBy:/g, 'const subjects = await prisma.subject.findMany({\n      where: { tenantId },\n      orderBy:');
// Add tenantId to students
content = content.replace(/const students = await prisma\.student\.findMany\(\{\s*where: \{ isGraduated: true \},/g, 'const students = await prisma.student.findMany({\n      where: { isGraduated: true, tenantId },');

// Add tenantId to getAllGraduatedSklData
content = content.replace(/try {\n\s*\/\/ Fetch active academic year/g, 'try {\n    const tenantId = (req as any).user.tenantId;\n    // Fetch active academic year');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed document controller.');
