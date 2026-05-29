const fs = require('fs');

function replaceInFiles() {
  const dir = __dirname;
  
  // Recursively find all .tsx files
  const { execSync } = require('child_process');
  let files = [];
  try {
    files = execSync('dir /s /b *.tsx').toString().split('\r\n').filter(Boolean);
  } catch (e) {
    console.error(e);
  }

  let count = 0;
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Pattern 1: data?.schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN"
    // Pattern 2: schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN"
    // Pattern 3: >YAYASAN BUSTANUL HUDA DAWUHAN<

    // We will do a regex replacement.
    content = content.replace(/data\?\.schoolProfile\?\.tenant\?\.name\?\.toUpperCase\(\)\s*\|\|\s*["']YAYASAN BUSTANUL HUDA DAWUHAN["']/g, 'data?.schoolProfile?.foundationName?.toUpperCase() || data?.schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN"');
    
    content = content.replace(/schoolProfile\?\.tenant\?\.name\?\.toUpperCase\(\)\s*\|\|\s*["']YAYASAN BUSTANUL HUDA DAWUHAN["']/g, 'schoolProfile?.foundationName?.toUpperCase() || schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN"');
    
    // For direct JSX strings: <span className="kop-line-yayasan">YAYASAN BUSTANUL HUDA DAWUHAN</span>
    content = content.replace(/>YAYASAN BUSTANUL HUDA DAWUHAN</g, '>{schoolProfile?.foundationName?.toUpperCase() || schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN"}<');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated', file);
      count++;
    }
  }
  console.log(`Updated ${count} files.`);
}

replaceInFiles();
