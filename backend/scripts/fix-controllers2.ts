import * as fs from 'fs';
import * as path from 'path';

const controllersDir = path.join(__dirname, '..', 'src', 'controllers');

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace findUnique with findFirst for non-id keys
  content = content.replace(/findUnique\(\{ where: \{ nis([^a-zA-Z])/g, 'findFirst({ where: { nis$1');
  content = content.replace(/findUnique\(\{ where: \{ nisn([^a-zA-Z])/g, 'findFirst({ where: { nisn$1');
  content = content.replace(/findUnique\(\{ where: \{ code([^a-zA-Z])/g, 'findFirst({ where: { code$1');
  content = content.replace(/findUnique\(\{ where: \{ certificateNumber([^a-zA-Z])/g, 'findFirst({ where: { certificateNumber$1');
  
  // Same for tx
  content = content.replace(/tx\.([a-zA-Z0-9_]+)\.findUnique\(\{ where: \{ nis([^a-zA-Z])/g, 'tx.$1.findFirst({ where: { nis$2');
  content = content.replace(/tx\.([a-zA-Z0-9_]+)\.findUnique\(\{ where: \{ nisn([^a-zA-Z])/g, 'tx.$1.findFirst({ where: { nisn$2');

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

console.log('Done fixing controllers');
