import * as fs from 'fs';
import * as path from 'path';

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Change tenantId String to tenantId String?
schema = schema.replace(/tenantId(\s+)String(\s+)@map\("tenant_id"\)/g, 'tenantId$1String?$2@map("tenant_id")');
schema = schema.replace(/tenantId(\s+)String(\s+)@unique/g, 'tenantId$1String?$2@unique');
schema = schema.replace(/tenantId(\s+)String(\s+)(?!@id)/g, 'tenantId$1String?$2');

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Schema updated');
