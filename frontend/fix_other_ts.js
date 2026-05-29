const fs = require('fs');

function replaceFile(path, replacer) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = replacer(content);
    fs.writeFileSync(path, content);
  }
}

// 1. TKA page error
replaceFile('e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\grades\\tka\\page.tsx', content => {
  return content.replace(/setSubjects\(data\.subjects\);/g, 'if (res.data) setSubjects(res.data.subjects || []);');
});

// 2. Batch print page errors
replaceFile('e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\print-skl\\batch\\page.tsx', content => {
  let newContent = content.replace(/foundationName/g, 'name'); // as fallback
  newContent = newContent.replace(/student\.grades\.map/g, '(student.grades || []).map');
  return newContent;
});

console.log('Fixed additional typescript errors!');
