const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'grade.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Add timeout to async (tx) transactions
content = content.replace(/\}\)\.catch\(\(err\) => \{/g, '}, { maxWait: 100000, timeout: 100000 }).catch((err) => {');

// Fix 2: Add timeout to array-based transactions (saveReportGrades / saveExamGrades)
// In saveReportGrades/saveExamGrades:
//         })
//       )
//     );
// Let's replace the one that corresponds to transaction closing
// Wait, looking at lines 239-241:
/*
        })
      )
    );
*/
content = content.replace(/\}\)\n\s*\)\n\s*\);/g, '})\n      ),\n      { maxWait: 100000, timeout: 100000 }\n    );');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Added transaction timeouts.');
