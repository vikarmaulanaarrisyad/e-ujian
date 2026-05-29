const fs = require('fs');
const path = 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\grades\\tka\\page.tsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/if \(data\)/g, 'if (res.data)');
  fs.writeFileSync(path, content);
}
console.log('Fixed tka page');
