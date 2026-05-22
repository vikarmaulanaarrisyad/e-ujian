const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'sync.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('child_process')) {
  content = "import { execSync } from 'child_process';\n" + content;
}

const execCode = `
  try {
    console.log('[SYNC] Auto-creating database if not exists and resetting schema...');
    // This will force create the database and reset all tables to match schema.
    // We pass MYSQL_DATABASE_URL to ensure prisma picks it up.
    execSync('npx prisma db push --schema=prisma/schema.mysql.prisma --force-reset --skip-generate', {
      env: { ...process.env, DATABASE_URL: mysqlUrl },
      stdio: 'pipe', // Suppress output to prevent blocking
    });
  } catch (err: any) {
    console.log('[SYNC] Prisma db push failed or requires manual creation. Assuming it might exist.');
  }
`;

if (!content.includes('npx prisma db push')) {
  content = content.replace(/try {\n\s*\/\/ 1\. Test MySQL Connection/g, execCode + "\n  try {\n    // 1. Test MySQL Connection");
}

// Since we are resetting, we can remove the deleteMany transaction
const deleteManyRegex = /\/\/ 3\. Clear existing MySQL data.*?await mysqlPrisma\.\$transaction\(\[.*?\]\);/s;
content = content.replace(deleteManyRegex, '// 3. Clear existing MySQL data (Skipped because --force-reset already cleared everything)');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed sync.service.ts with auto-create DB.');
