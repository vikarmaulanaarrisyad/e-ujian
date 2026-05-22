const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'grade.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace duplicate const tenantId = (req as any).user.tenantId; declarations within a block
content = content.replace(/(const tenantId = \(req as any\)\.user\.tenantId;[\s\S]*?)const tenantId = \(req as any\)\.user\.tenantId;/g, '$1');
content = content.replace(/(const tenantId = \(req as any\)\.user\.tenantId;[\s\S]*?)const tenantId = \(req as any\)\.user\.tenantId;/g, '$1');
content = content.replace(/(const tenantId = \(req as any\)\.user\.tenantId;[\s\S]*?)const tenantId = \(req as any\)\.user\.tenantId;/g, '$1');
// Do it multiple times to ensure all duplicates within a few lines are caught. But actually, better regex for function block:
// Just match `export const ... { ... }` and remove all but the first `const tenantId = ...` 

const lines = content.split('\n');
let insideFunction = false;
let foundTenantIdInFunction = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export const')) {
    insideFunction = true;
    foundTenantIdInFunction = false;
  }
  
  if (insideFunction && lines[i].includes('const tenantId = (req as any).user.tenantId;')) {
    if (foundTenantIdInFunction) {
      lines[i] = ''; // remove duplicate
    } else {
      foundTenantIdInFunction = true;
    }
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Removed duplicate tenantId declarations.');
