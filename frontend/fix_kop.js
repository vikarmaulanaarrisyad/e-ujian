const fs = require('fs');
const path = require('path');

const files = [
  'app/(dashboard)/dashboard/students/graduation/print-skl/[id]/page.tsx',
  'app/(dashboard)/dashboard/students/graduation/print-skl/batch/page.tsx',
  'app/(dashboard)/dashboard/grades/recap/page.tsx'
];

for (const relPath of files) {
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix Yayasan name
  content = content.replace(/>YAYASAN BUSTANUL HUDA DAWUHAN</g, '>{schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN"}<');
  content = content.replace(/'YAYASAN BUSTANUL HUDA DAWUHAN'/g, 'data?.schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN"');

  // Fix NSM
  content = content.replace(/NSM: 111233280040/g, 'NSM: {schoolProfile?.nsm || "-"}');
  content = content.replace(/NSM : 111233280040/g, 'NSM : ${data?.schoolProfile?.nsm || "-"}');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${relPath}`);
}
