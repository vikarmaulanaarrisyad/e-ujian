import prisma from '../src/db';
import ExcelJS from 'exceljs';

const getActiveYear = async () => {
  return await prisma.academicYear.findFirst({
    where: { isActive: true },
    include: { gradeWeights: true },
  });
};

async function run() {
  try {
    console.log("Checking active year...");
    const activeYear = await getActiveYear();
    console.log("Active Year:", activeYear);
    if (!activeYear) {
      console.error("No active year found");
      return;
    }

    console.log("Fetching subjects...");
    const subjects = await prisma.subject.findMany({
      orderBy: [
        { group: 'asc' },
        { name: 'asc' }
      ]
    });
    console.log(`Found ${subjects.length} subjects.`);

    console.log("Fetching students...");
    const students = await prisma.student.findMany({
      orderBy: { name: 'asc' },
      include: {
        reportGrades: {
          where: {
            academicYearId: activeYear.id
          }
        }
      }
    });
    console.log(`Found ${students.length} students.`);

    console.log("Generating Excel Workbook...");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Nilai Rapor Semua Mapel');

    worksheet.views = [
      { state: 'frozen', xSplit: 3, ySplit: 2 }
    ];

    const columns: any[] = [
      { key: 'nis', width: 15 },
      { key: 'nisn', width: 15 },
      { key: 'name', width: 30 }
    ];

    subjects.forEach((subj) => {
      for (let sem = 7; sem <= 11; sem++) {
        columns.push({
          key: `${subj.code}_sem${sem}`,
          width: 10
        });
      }
    });

    worksheet.columns = columns;

    const row1 = worksheet.getRow(1);
    row1.height = 30;
    row1.getCell(1).value = 'NIS';
    row1.getCell(2).value = 'NISN';
    row1.getCell(3).value = 'Nama Lengkap';

    subjects.forEach((subj, i) => {
      const startCol = 4 + i * 5;
      const endCol = startCol + 4;
      worksheet.mergeCells(1, startCol, 1, endCol);
      const cell = row1.getCell(startCol);
      cell.value = `[${subj.code}] ${subj.name}`;
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Arial', size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1F497D' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    for (let c = 1; c <= 3; c++) {
      const cell = row1.getCell(c);
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Arial', size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1F497D' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    const row2 = worksheet.getRow(2);
    row2.height = 25;
    row2.getCell(1).value = '';
    row2.getCell(2).value = '';
    row2.getCell(3).value = '';

    subjects.forEach((subj, i) => {
      const startCol = 4 + i * 5;
      for (let sem = 7; sem <= 11; sem++) {
        const colIdx = startCol + (sem - 7);
        const cell = row2.getCell(colIdx);
        cell.value = `Smt ${sem}`;
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Arial', size: 10 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '5B9BD5' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    for (let c = 1; c <= 3; c++) {
      const cell = row2.getCell(c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1F497D' }
      };
    }

    students.forEach((student) => {
      const rowData: any = {
        nis: student.nis,
        nisn: student.nisn,
        name: student.name
      };

      subjects.forEach((subj) => {
        for (let sem = 7; sem <= 11; sem++) {
          const matchingGrade = student.reportGrades.find(
            (rg) => rg.subjectId === subj.id && rg.semester === sem
          );
          rowData[`${subj.code}_sem${sem}`] = matchingGrade ? matchingGrade.score : '';
        }
      });

      const newRow = worksheet.addRow(rowData);
      newRow.height = 20;

      newRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'D9D9D9' } },
          left: { style: 'thin', color: { argb: 'D9D9D9' } },
          bottom: { style: 'thin', color: { argb: 'D9D9D9' } },
          right: { style: 'thin', color: { argb: 'D9D9D9' } }
        };

        if (colNumber > 3) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { vertical: 'middle' };
          if (colNumber <= 2) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        }
      });
    });

    console.log("Writing test.xlsx file...");
    await workbook.xlsx.writeFile('scratch/test.xlsx');
    console.log("Success! File written to scratch/test.xlsx");
  } catch (err) {
    console.error("Error occurred:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
