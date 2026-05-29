const fs = require('fs');

// 1. Update backend document.controller.ts
const docControllerPath = 'e:\\NEXTJS\\e-ujian\\backend\\src\\controllers\\document.controller.ts';
let docController = fs.readFileSync(docControllerPath, 'utf8');

docController = docController.replace(
  /const totalExamScore = grades\.reduce\(\(acc, curr\) => acc \+ curr\.examScore, 0\);\s*const averageExamScore = grades\.length > 0 \? Number\(\(totalExamScore \/ grades\.length\)\.toFixed\(2\)\) : 0;/g,
  `const validGrades = grades.filter(g => g.examScore > 0);
        const totalExamScore = validGrades.reduce((acc, curr) => acc + curr.examScore, 0);
        const averageExamScore = validGrades.length > 0 ? Number((totalExamScore / validGrades.length).toFixed(2)) : 0;`
);
fs.writeFileSync(docControllerPath, docController);

// 2. Update frontend IndividualSklDownloader.tsx
const indSklPath = 'e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualSklDownloader.tsx';
let indSkl = fs.readFileSync(indSklPath, 'utf8');

// Change table CSS
indSkl = indSkl.replace(
  /\.skl-nilai-table \{ width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; font-family: "Times New Roman", Times, serif; \}\n\s*\.skl-nilai-table th, \.skl-nilai-table td \{ border: 1\.5px solid black; padding: 2px 6px; font-size: 13px; \}/,
  `.skl-nilai-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 12px; font-family: "Times New Roman", Times, serif; }
              .skl-nilai-table th, .skl-nilai-table td { border: 1.5px solid black; padding: 6px 8px; font-size: 14px; }`
);

// Filter grades in HTML
indSkl = indSkl.replace(
  /docData\.grades\.map\(\(g: any, idx: number\) => \(/,
  `docData.grades.filter((g: any) => g.examScore > 0).map((g: any, idx: number) => (`
);

fs.writeFileSync(indSklPath, indSkl);

// 3. Update frontend BatchSklDownloader.tsx
const batchSklPath = 'e:\\NEXTJS\\e-ujian\\frontend\\components\\BatchSklDownloader.tsx';
let batchSkl = fs.readFileSync(batchSklPath, 'utf8');

// Change table CSS
batchSkl = batchSkl.replace(
  /\.skl-nilai-table \{ width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; font-family: "Times New Roman", Times, serif; \}\n\s*\.skl-nilai-table th, \.skl-nilai-table td \{ border: 1\.5px solid black; padding: 2px 6px; font-size: 13px; \}/,
  `.skl-nilai-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 12px; font-family: "Times New Roman", Times, serif; }
              .skl-nilai-table th, .skl-nilai-table td { border: 1.5px solid black; padding: 6px 8px; font-size: 14px; }`
);

// Filter grades in HTML
batchSkl = batchSkl.replace(
  /student\.grades && student\.grades\.map\(\(g: any, idx: number\) => \(/,
  `student.grades && student.grades.filter((g: any) => g.examScore > 0).map((g: any, idx: number) => (`
);

fs.writeFileSync(batchSklPath, batchSkl);

console.log('Fixed average calculation and styles!');
