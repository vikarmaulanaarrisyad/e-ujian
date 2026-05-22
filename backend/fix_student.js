const fs = require('fs');
const path = require('path');

const studentCtrlPath = path.join(__dirname, 'src', 'controllers', 'student.controller.ts');
let content = fs.readFileSync(studentCtrlPath, 'utf8');

// Inject tenantId if missing in controllers
content = content.replace(/(export const \w+ = async \(req: Request, res: Response, next: NextFunction\) => {\s*try {\s*)(?!const tenantId)/g, '$1const tenantId = (req as any).user.tenantId;\n    ');

// Replace findMany filter for getAllStudents
content = content.replace(/filter\.isAlumni = isAlumniParam;/g, 'filter.isAlumni = isAlumniParam;\n    filter.tenantId = tenantId;');

// Fix getStudentById
content = content.replace(/where: { id },/g, 'where: { id, tenantId },');

// Fix createStudent existingNis / nisn check
content = content.replace(/where: { nis } }/g, 'where: { nis, tenantId } }');
content = content.replace(/where: { nisn } }/g, 'where: { nisn, tenantId } }');

// Fix createStudent actual create (needs tenantId)
// Wait, createStudent validation.data doesn't have tenantId. So we need to add tenantId to data.
content = content.replace(/data: validation\.data,/g, 'data: { ...validation.data, tenantId },');
// Wait, updateStudent also has data: validation.data. It shouldn't change tenantId, so it's fine. 
// But wait, my replace will hit updateStudent too. Let's just fix it properly.
// updateStudent has `where: { id }`. We already fixed that to `where: { id, tenantId }`.

// Fix getStudentTemplate - doesn't use DB, fine.

// Fix exportStudents
content = content.replace(/const students = await prisma\.student\.findMany\(\{\s*orderBy: \{ name: 'asc' \},\s*\}\);/g, "const students = await prisma.student.findMany({\n      where: { tenantId },\n      orderBy: { name: 'asc' },\n    });");

// Fix importStudents
// The transaction loop has findFirst for existingNis
content = content.replace(/where: \{ nis: student\.nis \}/g, 'where: { nis: student.nis, tenantId }');
content = content.replace(/where: \{ nisn: student\.nisn \}/g, 'where: { nisn: student.nisn, tenantId }');
// The create should include tenantId
content = content.replace(/\{ data: student \}/g, '{ data: { ...student, tenantId } }');

// Fix updateGraduationStatus
content = content.replace(/where: \{ certificateNumber \}/g, 'where: { certificateNumber, tenantId }');

// Fix batchUpdateGraduation
content = content.replace(/where: \{ id: \{ in: studentIds \} \}/g, 'where: { id: { in: studentIds }, tenantId }');

// Fix batchAssignSklNumbers
content = content.replace(/const profile = await prisma\.schoolProfile\.findFirst\(\);/g, 'const profile = await prisma.schoolProfile.findUnique({ where: { tenantId } });');
content = content.replace(/where: \{ isGraduated: true \},/g, 'where: { isGraduated: true, tenantId },');

// Fix uploadPhotos
content = content.replace(/where: \{ nisn \}/g, 'where: { nisn, tenantId }');

// Fix archiveStudents
content = content.replace(/isAlumni: false,\s*\}/g, 'isAlumni: false,\n        tenantId,\n      }');
content = content.replace(/const activeYearRecord = await prisma\.academicYear\.findFirst\(\{\s*where: \{ isActive: true \},\s*\}\);/g, 'const activeYearRecord = await prisma.academicYear.findFirst({ where: { isActive: true, tenantId } });');

fs.writeFileSync(studentCtrlPath, content, 'utf8');

const backupCtrlPath = path.join(__dirname, 'src', 'controllers', 'backup.controller.ts');
let backupContent = fs.readFileSync(backupCtrlPath, 'utf8');
backupContent = backupContent.replace(/(export const exportBackup = async \(req: Request, res: Response, next: NextFunction\) => {\s*try {\s*)(?!const tenantId)/g, '$1const tenantId = (req as any).user.tenantId;\n    ');

// For backup, limit everything to tenantId
backupContent = backupContent.replace(/prisma\.schoolProfile\.findFirst\(\)/g, 'prisma.schoolProfile.findUnique({ where: { tenantId } })');
backupContent = backupContent.replace(/prisma\.(\w+)\.findMany\(\)/g, 'prisma.$1.findMany({ where: { tenantId } })');

fs.writeFileSync(backupCtrlPath, backupContent, 'utf8');

console.log('Fixed student.controller.ts and backup.controller.ts');
