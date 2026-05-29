const fs = require('fs');

// 1. Update IndividualSklDownloader.tsx
const indSklPath = 'e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualSklDownloader.tsx';
let indSkl = fs.readFileSync(indSklPath, 'utf8');

// Replace {Number(docData.averageExamScore).toFixed(2).replace('.', ',')}
// with a dynamically computed average based on valid grades!
indSkl = indSkl.replace(
  /\{Number\(docData\.averageExamScore\)\.toFixed\(2\)\.replace\('\.', ','\)\}/g,
  `{(() => {
                                const valid = docData.grades.filter((g: any) => g.examScore > 0);
                                const total = valid.reduce((acc: number, curr: any) => acc + Number(curr.examScore), 0);
                                const avg = valid.length > 0 ? total / valid.length : 0;
                                return Number(avg).toFixed(2).replace('.', ',');
                              })()}`
);
fs.writeFileSync(indSklPath, indSkl);

// 2. Update BatchSklDownloader.tsx
const batchSklPath = 'e:\\NEXTJS\\e-ujian\\frontend\\components\\BatchSklDownloader.tsx';
let batchSkl = fs.readFileSync(batchSklPath, 'utf8');

// Replace {Number(student.averageExamScore).toFixed(2).replace('.', ',')}
batchSkl = batchSkl.replace(
  /\{Number\(student\.averageExamScore\)\.toFixed\(2\)\.replace\('\.', ','\)\}/g,
  `{(() => {
                                  const valid = student.grades.filter((g: any) => g.examScore > 0);
                                  const total = valid.reduce((acc: number, curr: any) => acc + Number(curr.examScore), 0);
                                  const avg = valid.length > 0 ? total / valid.length : 0;
                                  return Number(avg).toFixed(2).replace('.', ',');
                                })()}`
);
fs.writeFileSync(batchSklPath, batchSkl);

console.log('Fixed average calculation to compute directly in frontend!');
