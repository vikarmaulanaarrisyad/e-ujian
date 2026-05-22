const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'grade.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Remove ALL exact matches of `const tenantId = (req as any).user.tenantId;`
content = content.replace(/const tenantId = \(req as any\)\.user\.tenantId;/g, '');

// Step 2: In every controller function, after `try {`, add it exactly once.
content = content.replace(/(export const \w+\s*=\s*async\s*\(req:\s*Request,\s*res:\s*Response,\s*next:\s*NextFunction\)\s*=>\s*{\s*try\s*{)/g, '$1\n    const tenantId = (req as any).user.tenantId;');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed tenantId injection properly.');
