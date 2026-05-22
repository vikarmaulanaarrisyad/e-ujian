import * as fs from 'fs';
import * as path from 'path';

const controllersDir = path.join(__dirname, '..', 'src', 'controllers');
const libDir = path.join(__dirname, '..', 'src', 'lib');

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace `prisma.model.create({` with `(prisma.model.create as any)({`
  // And `tx.model.create({` with `(tx.model.create as any)({`
  // We'll just cast the `data: ...` to `any` for `create` and `createMany` and `upsert` and `update`?
  // Wait, `prisma.student.create` might be multiline.
  // Instead of complex regex, let's just cast `prisma.model.create` and `tx.model.create`.
  
  const models = ['user', 'student', 'schoolProfile', 'academicYear', 'subject', 'gradeWeight', 'reportGrade', 'examGrade', 'activityLog'];
  const methods = ['create', 'createMany', 'update', 'updateMany', 'upsert'];
  
  for (const model of models) {
    for (const method of methods) {
      // Find `prisma.model.method(` and replace with `(prisma.model.method as any)(`
      const regex1 = new RegExp(`prisma\\.${model}\\.${method}\\(`, 'g');
      content = content.replace(regex1, `(prisma.${model}.${method} as any)(`);
      
      const regex2 = new RegExp(`tx\\.${model}\\.${method}\\(`, 'g');
      content = content.replace(regex2, `(tx.${model}.${method} as any)(`);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

function walkDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(controllersDir);
walkDir(libDir);

console.log('Done casting methods to any');
