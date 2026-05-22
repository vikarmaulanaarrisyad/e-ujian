const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'grade.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\),\n      \{ maxWait: 100000, timeout: 100000 \}\n    \);/g, ')\n    );');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Removed invalid timeout from array transactions.');
