const fs = require('fs');

const docControllerPath = 'e:\\NEXTJS\\e-ujian\\backend\\src\\controllers\\document.controller.ts';
let docController = fs.readFileSync(docControllerPath, 'utf8');

docController = docController.replace(
  /const totalExamScore = grades\.reduce\(\(acc, curr\) => acc \+ curr\.examScore, 0\);\s*const averageExamScore = grades\.length > 0 \? Number\(\(totalExamScore \/ grades\.length\)\.toFixed\(2\)\) : 0;/,
  `const validGrades = grades.filter(g => g.examScore > 0);
    const totalExamScore = validGrades.reduce((acc, curr) => acc + curr.examScore, 0);
    const averageExamScore = validGrades.length > 0 ? Number((totalExamScore / validGrades.length).toFixed(2)) : 0;`
);

fs.writeFileSync(docControllerPath, docController);

console.log('Fixed getStudentSklData average calculation!');
