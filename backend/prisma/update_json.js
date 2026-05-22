const fs = require('fs');

['schema.prisma', 'schema.mysql.prisma'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/metadata\s+Json\?/g, 'metadata    String?');
  fs.writeFileSync(file, content);
});

console.log('Updated metadata field type to String');
