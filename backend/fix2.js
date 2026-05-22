const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'grade.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// The strategy is to find `export const functionName = async (req: Request, res: Response, next: NextFunction) => {\n  try {\n`
// And if `const tenantId = (req as any).user.tenantId;` is not present, add it.

content = content.replace(/(export const \w+ = async \(req: Request, res: Response, next: NextFunction\) => {\s*try {\s*)(?!const tenantId)/g, '$1const tenantId = (req as any).user.tenantId;\n    ');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Injected tenantId declaration into all controllers.');
