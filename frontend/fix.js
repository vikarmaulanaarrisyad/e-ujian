const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Downloader.tsx'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace: TERAKREDITASI A NSM {docData.schoolProfile
  // With: TERAKREDITASI {docData.schoolProfile.accreditation || 'A'} NSM {docData.schoolProfile
  content = content.replace(/TERAKREDITASI A NSM \{([a-zA-Z]+)\.schoolProfile/g, "TERAKREDITASI {$1.schoolProfile.accreditation || 'A'} NSM {$1.schoolProfile");
  
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + f);
});
