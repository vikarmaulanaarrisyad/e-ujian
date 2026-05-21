import { Request, Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import prisma from '../db';
import { updateGradeWeightSchema, saveReportGradesSchema, saveExamGradesSchema } from '../validators/grade.validator';
import fs from 'fs';

// Helper to get active academic year
const getActiveYear = async () => {
  return await prisma.academicYear.findFirst({
    where: { isActive: true },
    include: { gradeWeights: true },
  });
};

// Helper to safely extract string value from Excel cell
const getCellValueAsString = (cell: ExcelJS.Cell): string => {
  const val = cell.value;
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    // Check richText
    if ('richText' in val && Array.isArray(val.richText)) {
      return val.richText.map(t => t.text || '').join('').trim();
    }
    // Check formula result
    if ('result' in val) {
      const result = val.result;
      return result === null || result === undefined ? '' : String(result).trim();
    }
    // Check Date
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    return JSON.stringify(val).trim();
  }
  return String(val).trim();
};

// ==========================================
// GRADE WEIGHT SETTINGS
// ==========================================

export const getGradeWeight = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeYear = await getActiveYear();
    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    let weight = activeYear.gradeWeights[0];
    if (!weight) {
      // Create a default if not exists
      weight = await prisma.gradeWeight.create({
        data: {
          reportPercentage: 60.0,
          examPercentage: 40.0,
          academicYearId: activeYear.id,
        },
      });
    }

    const profile: any = await prisma.schoolProfile.findFirst();

    return res.status(200).json({
      academicYear: {
        id: activeYear.id,
        year: activeYear.year,
        semester: activeYear.semester,
      },
      weight,
      schoolProfile: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGradeWeight = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = updateGradeWeightSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const activeYear = await getActiveYear();
    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const { reportPercentage, examPercentage } = validation.data;

    let weight = activeYear.gradeWeights[0];
    if (weight) {
      weight = await prisma.gradeWeight.update({
        where: { id: weight.id },
        data: { reportPercentage, examPercentage },
      });
    } else {
      weight = await prisma.gradeWeight.create({
        data: {
          reportPercentage,
          examPercentage,
          academicYearId: activeYear.id,
        },
      });
    }

    return res.status(200).json({
      message: 'Grade weights updated successfully',
      weight,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// REPORT CARD GRADES (SEM 7-11)
// ==========================================

export const getReportGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) {
      return res.status(400).json({ message: 'Subject ID is required' });
    }

    const activeYear = await getActiveYear();
    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    // Check subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: String(subjectId) },
    });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const students = await prisma.student.findMany({
      orderBy: { name: 'asc' },
      include: {
        reportGrades: {
          where: {
            subjectId: String(subjectId),
            academicYearId: activeYear.id,
          },
        },
      },
    });

    const data = students.map((student) => {
      const grades: Record<number, number | null> = { 7: null, 8: null, 9: null, 10: null, 11: null };
      student.reportGrades.forEach((g) => {
        grades[g.semester] = g.score;
      });

      return {
        studentId: student.id,
        studentName: student.name,
        nis: student.nis,
        nisn: student.nisn,
        grades,
      };
    });

    return res.status(200).json({
      subject,
      academicYearId: activeYear.id,
      students: data,
    });
  } catch (error) {
    next(error);
  }
};

export const saveReportGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = saveReportGradesSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const activeYear = await getActiveYear();
    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const { grades } = validation.data;

    await prisma.$transaction(
      grades.map((g) =>
        prisma.reportGrade.upsert({
          where: {
            studentId_subjectId_academicYearId_semester: {
              studentId: g.studentId,
              subjectId: g.subjectId,
              academicYearId: activeYear.id,
              semester: g.semester,
            },
          },
          update: { score: g.score },
          create: {
            studentId: g.studentId,
            subjectId: g.subjectId,
            academicYearId: activeYear.id,
            semester: g.semester,
            score: g.score,
          },
        })
      )
    );

    return res.status(200).json({ message: 'Report card grades saved successfully' });
  } catch (error) {
    next(error);
  }
};

// Export Report template or existing grades for a Subject
export const exportReportGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId, semester } = req.query;
    if (!subjectId) {
      return res.status(400).json({ message: 'Subject ID is required' });
    }

    const activeYear = await getActiveYear();
    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const subject = await prisma.subject.findUnique({ where: { id: String(subjectId) } });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const targetSemester = semester ? parseInt(String(semester)) : null;

    const students = await prisma.student.findMany({
      orderBy: { name: 'asc' },
      include: {
        reportGrades: {
          where: {
            subjectId: subject.id,
            academicYearId: activeYear.id,
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Nilai Rapor - ${subject.name}`);

    // Freeze A-C (NIS, NISN, Name) and first row
    worksheet.views = [
      { state: 'frozen', xSplit: 3, ySplit: 1 }
    ];

    const baseColumns = [
      { key: 'nis', width: 15 },
      { key: 'nisn', width: 15 },
      { key: 'name', width: 30 },
    ];

    if (targetSemester) {
      baseColumns.push({ key: `sem${targetSemester}`, width: 12 });
    } else {
      for (let sem = 7; sem <= 11; sem++) {
        baseColumns.push({ key: `sem${sem}`, width: 12 });
      }
    }
    worksheet.columns = baseColumns;

    const headerBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'A0A0A0' } },
      left: { style: 'thin', color: { argb: 'A0A0A0' } },
      bottom: { style: 'thin', color: { argb: 'A0A0A0' } },
      right: { style: 'thin', color: { argb: 'A0A0A0' } }
    };

    const row1 = worksheet.getRow(1);
    row1.height = 30;

    row1.getCell(1).value = 'NIS';
    row1.getCell(2).value = 'NISN';
    row1.getCell(3).value = 'Nama Lengkap';

    if (targetSemester) {
      row1.getCell(4).value = `Smt ${targetSemester}`;
    } else {
      for (let sem = 7; sem <= 11; sem++) {
        row1.getCell(4 + (sem - 7)).value = `Smt ${sem}`;
      }
    }

    const totalCols = targetSemester ? 4 : 8;

    for (let c = 1; c <= totalCols; c++) {
      const cell = row1.getCell(c);
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Arial', size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1F497D' } // Navy blue
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = headerBorder;
    }
    row1.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };

    // Hide unused columns
    for (let col = totalCols + 1; col <= totalCols + 101; col++) {
      worksheet.getColumn(col).hidden = true;
    }

    students.forEach((student) => {
      const rowData: any = {
        nis: student.nis,
        nisn: student.nisn,
        name: student.name,
      };

      if (targetSemester) {
        const matchingGrade = student.reportGrades.find(
          (rg) => rg.semester === targetSemester
        );
        rowData[`sem${targetSemester}`] = matchingGrade ? matchingGrade.score : '';
      } else {
        for (let sem = 7; sem <= 11; sem++) {
          const matchingGrade = student.reportGrades.find(
            (rg) => rg.semester === sem
          );
          rowData[`sem${sem}`] = matchingGrade ? matchingGrade.score : '';
        }
      }

      const newRow = worksheet.addRow(rowData);
      newRow.height = 20;

      // Add borders and formatting
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

    const fileSemesterSuffix = targetSemester ? `_smt_${targetSemester}` : '';
    const fileName = `nilai_rapor_${subject.code.toLowerCase()}${fileSemesterSuffix}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// Import Report Grades for a Subject
export const importReportGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId } = req.body;
    if (!subjectId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Subject ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No Excel file uploaded' });
    }

    const activeYear = await getActiveYear();
    if (!activeYear) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const subject = await prisma.subject.findUnique({ where: { id: String(subjectId) } });
    if (!subject) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Subject not found' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Worksheet not found' });
    }

    const gradesToUpsert: any[] = [];
    const errors: string[] = [];

    const semesterMap: Record<number, number> = {}; // maps colIndex to semester (7-11)
    const headerRow = worksheet.getRow(1);
    
    for (let col = 4; col <= worksheet.columnCount; col++) {
      const val = getCellValueAsString(headerRow.getCell(col));
      if (val) {
        const match = val.match(/\b(7|8|9|10|11)\b/);
        if (match) {
          semesterMap[col] = parseInt(match[1]);
        }
      }
    }

    // Fallback to default mapping if no semester column header is recognized
    if (Object.keys(semesterMap).length === 0) {
      for (let i = 0; i < 5; i++) {
        semesterMap[4 + i] = 7 + i;
      }
    }

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip headers

      const nis = getCellValueAsString(row.getCell(1));
      const name = getCellValueAsString(row.getCell(3));

      if (!nis && !name) return;

      Object.entries(semesterMap).forEach(([colIdxStr, sem]) => {
        const colIdx = parseInt(colIdxStr);
        const valRaw = row.getCell(colIdx).value;
        if (valRaw === null || valRaw === undefined || String(valRaw).trim() === '') {
          return; // Skip empty
        }

        const score = Number(valRaw);
        if (isNaN(score) || score < 0 || score > 100) {
          errors.push(`Row ${rowNumber}: Semester ${sem} score must be a number between 0 and 100.`);
          return;
        }

        gradesToUpsert.push({
          nis,
          semester: sem,
          score,
        });
      });
    });

    if (errors.length > 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Excel parsing validation errors', errors });
    }

    let savedCount = 0;
    const dbErrors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of gradesToUpsert) {
        const student = await tx.student.findUnique({ where: { nis: item.nis } });
        if (!student) {
          throw new Error(`Student with NIS '${item.nis}' not found in the database.`);
        }

        await tx.reportGrade.upsert({
          where: {
            studentId_subjectId_academicYearId_semester: {
              studentId: student.id,
              subjectId: subject.id,
              academicYearId: activeYear.id,
              semester: item.semester,
            },
          },
          update: { score: item.score },
          create: {
            studentId: student.id,
            subjectId: subject.id,
            academicYearId: activeYear.id,
            semester: item.semester,
            score: item.score,
          },
        });
        savedCount++;
      }
    }).catch((err) => {
      dbErrors.push(err.message);
    });

    fs.unlinkSync(req.file.path);

    if (dbErrors.length > 0) {
      return res.status(400).json({ message: 'Import failed', errors: dbErrors });
    }

    return res.status(200).json({
      message: `Successfully imported ${savedCount} report card grades.`,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// ==========================================
// MADRASAH EXAM GRADES
// ==========================================

export const getExamGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) {
      return res.status(400).json({ message: 'Subject ID is required' });
    }

    const activeYear = await getActiveYear();
    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: String(subjectId) },
    });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const students = await prisma.student.findMany({
      orderBy: { name: 'asc' },
      include: {
        examGrades: {
          where: {
            subjectId: String(subjectId),
            academicYearId: activeYear.id,
          },
        },
      },
    });

    const data = students.map((student) => {
      const examScore = student.examGrades[0]?.score ?? null;

      return {
        studentId: student.id,
        studentName: student.name,
        nis: student.nis,
        nisn: student.nisn,
        score: examScore,
      };
    });

    return res.status(200).json({
      subject,
      academicYearId: activeYear.id,
      students: data,
    });
  } catch (error) {
    next(error);
  }
};

export const saveExamGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = saveExamGradesSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const activeYear = await getActiveYear();
    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const { grades } = validation.data;

    await prisma.$transaction(
      grades.map((g) =>
        prisma.examGrade.upsert({
          where: {
            studentId_subjectId_academicYearId: {
              studentId: g.studentId,
              subjectId: g.subjectId,
              academicYearId: activeYear.id,
            },
          },
          update: { score: g.score },
          create: {
            studentId: g.studentId,
            subjectId: g.subjectId,
            academicYearId: activeYear.id,
            score: g.score,
          },
        })
      )
    );

    return res.status(200).json({ message: 'Exam grades saved successfully' });
  } catch (error) {
    next(error);
  }
};

// Export Exam template or existing grades for a Subject
export const exportExamGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) {
      return res.status(400).json({ message: 'Subject ID is required' });
    }

    const activeYear = await getActiveYear();
    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const subject = await prisma.subject.findUnique({ where: { id: String(subjectId) } });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const students = await prisma.student.findMany({
      orderBy: { name: 'asc' },
      include: {
        examGrades: {
          where: {
            subjectId: subject.id,
            academicYearId: activeYear.id,
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Nilai Ujian - ${subject.name}`);

    // Freeze A-C and header row
    worksheet.views = [
      { state: 'frozen', xSplit: 3, ySplit: 1 }
    ];

    worksheet.columns = [
      { key: 'nis', width: 15 },
      { key: 'nisn', width: 15 },
      { key: 'name', width: 30 },
      { key: 'score', width: 15 },
    ];

    const headerBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'A0A0A0' } },
      left: { style: 'thin', color: { argb: 'A0A0A0' } },
      bottom: { style: 'thin', color: { argb: 'A0A0A0' } },
      right: { style: 'thin', color: { argb: 'A0A0A0' } }
    };

    const row1 = worksheet.getRow(1);
    row1.height = 30;

    row1.getCell(1).value = 'NIS';
    row1.getCell(2).value = 'NISN';
    row1.getCell(3).value = 'Nama Lengkap';
    row1.getCell(4).value = 'Nilai Ujian';

    for (let c = 1; c <= 4; c++) {
      const cell = row1.getCell(c);
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Arial', size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1F497D' } // Navy blue
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = headerBorder;
    }
    row1.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };

    // Hide unused columns
    for (let col = 5; col <= 105; col++) {
      worksheet.getColumn(col).hidden = true;
    }

    students.forEach((student) => {
      const examScore = student.examGrades[0]?.score ?? '';
      const newRow = worksheet.addRow({
        nis: student.nis,
        nisn: student.nisn,
        name: student.name,
        score: examScore,
      });
      newRow.height = 20;

      // Add borders and formatting
      newRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'D9D9D9' } },
          left: { style: 'thin', color: { argb: 'D9D9D9' } },
          bottom: { style: 'thin', color: { argb: 'D9D9D9' } },
          right: { style: 'thin', color: { argb: 'D9D9D9' } }
        };

        if (colNumber === 4) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { vertical: 'middle' };
          if (colNumber <= 2) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        }
      });
    });

    const fileName = `nilai_ujian_${subject.code.toLowerCase()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// Import Exam Grades for a Subject
export const importExamGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId } = req.body;
    if (!subjectId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Subject ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No Excel file uploaded' });
    }

    const activeYear = await getActiveYear();
    if (!activeYear) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const subject = await prisma.subject.findUnique({ where: { id: String(subjectId) } });
    if (!subject) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Subject not found' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Worksheet not found' });
    }

    const gradesToUpsert: any[] = [];
    const errors: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip headers

      const nis = getCellValueAsString(row.getCell(1));
      const name = getCellValueAsString(row.getCell(3));
      const scoreRaw = row.getCell(4).value;

      if (!nis && !name) return;

      if (scoreRaw === null || scoreRaw === undefined || scoreRaw === '') {
        return; // Empty score, skip
      }

      const score = Number(scoreRaw);
      if (isNaN(score) || score < 0 || score > 100) {
        errors.push(`Row ${rowNumber}: Score must be a number between 0 and 100.`);
        return;
      }

      gradesToUpsert.push({
        nis,
        score,
      });
    });

    if (errors.length > 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Excel parsing validation errors', errors });
    }

    let savedCount = 0;
    const dbErrors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of gradesToUpsert) {
        const student = await tx.student.findUnique({ where: { nis: item.nis } });
        if (!student) {
          throw new Error(`Student with NIS '${item.nis}' not found in the database.`);
        }

        await tx.examGrade.upsert({
          where: {
            studentId_subjectId_academicYearId: {
              studentId: student.id,
              subjectId: subject.id,
              academicYearId: activeYear.id,
            },
          },
          update: { score: item.score },
          create: {
            studentId: student.id,
            subjectId: subject.id,
            academicYearId: activeYear.id,
            score: item.score,
          },
        });
        savedCount++;
      }
    }).catch((err) => {
      dbErrors.push(err.message);
    });

    fs.unlinkSync(req.file.path);

    if (dbErrors.length > 0) {
      return res.status(400).json({ message: 'Import failed', errors: dbErrors });
    }

    return res.status(200).json({
      message: `Successfully imported ${savedCount} exam grades.`,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// ==========================================
// GRADE RECAP (FINALGRADES CALCULATIONS)
// ==========================================

export const getGradeRecap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeYear = await getActiveYear();
    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const weight = activeYear.gradeWeights[0] || { reportPercentage: 60.0, examPercentage: 40.0 };
    const rWeight = weight.reportPercentage / 100.0;
    const eWeight = weight.examPercentage / 100.0;

    // Fetch school profile
    let profile: any = await prisma.schoolProfile.findFirst();
    if (!profile) {
      profile = {
        id: 'default',
        name: 'MI Bustanul Huda Dawuhan',
        npsn: '20512345',
        address: 'Jl. Contoh Alamat No. 123, Dawuhan, Jawa Timur',
        headmaster: 'H. Fulan, S.Pd.I',
        headmasterNip: '19700101 200003 1 001',
        city: null,
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    if (profile.logoUrl && !profile.logoUrl.startsWith('http')) {
      const host = req.get('host');
      const protocol = req.protocol;
      profile.logoUrl = `${protocol}://${host}${profile.logoUrl}`;
    }

    // Fetch all students, report card grades, and exam grades
    const students = await prisma.student.findMany({
      orderBy: { name: 'asc' },
      include: {
        reportGrades: {
          where: { academicYearId: activeYear.id },
          include: { subject: true },
        },
        examGrades: {
          where: { academicYearId: activeYear.id },
          include: { subject: true },
        },
      },
    });

    // Fetch all subjects to make sure our list is complete
    const subjects = await prisma.subject.findMany({
      orderBy: [{ group: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    });

    const recap = students.map((student) => {
      // Group student report card grades by subjectId and compute average
      const reportGradesBySubject: Record<string, number[]> = {};
      student.reportGrades.forEach((rg) => {
        if (!reportGradesBySubject[rg.subjectId]) {
          reportGradesBySubject[rg.subjectId] = [];
        }
        reportGradesBySubject[rg.subjectId].push(rg.score);
      });

      // Group student exam grades by subjectId
      const examGradesBySubject: Record<string, number> = {};
      student.examGrades.forEach((eg) => {
        examGradesBySubject[eg.subjectId] = eg.score;
      });

      let totalFinalScore = 0;
      let scoredSubjectsCount = 0;

      const subjectScores = subjects.map((sub) => {
        const reportScores = reportGradesBySubject[sub.id] || [];
        const reportAverage = reportScores.length > 0 
          ? reportScores.reduce((sum, score) => sum + score, 0) / reportScores.length 
          : 0;

        const examScore = examGradesBySubject[sub.id] ?? 0;
        
        // Calculate final grade for this subject
        const finalScore = (reportAverage * rWeight) + (examScore * eWeight);
        
        if (reportScores.length > 0 || examGradesBySubject[sub.id] !== undefined) {
          totalFinalScore += finalScore;
          scoredSubjectsCount++;
        }

        return {
          subjectId: sub.id,
          subjectName: sub.name,
          subjectCode: sub.code,
          subjectGroup: sub.group,
          reportAverage: Number(reportAverage.toFixed(2)),
          examScore: Number(examScore.toFixed(2)),
          finalScore: Number(finalScore.toFixed(2)),
        };
      });

      const averageFinalScore = scoredSubjectsCount > 0 
        ? totalFinalScore / scoredSubjectsCount 
        : 0;

      return {
        studentId: student.id,
        nis: student.nis,
        nisn: student.nisn,
        studentName: student.name,
        gender: student.gender,
        subjectScores,
        totalFinalScore: Number(totalFinalScore.toFixed(2)),
        averageFinalScore: Number(averageFinalScore.toFixed(2)),
      };
    });

    // Calculate ranks based on averageFinalScore descending
    const sortedRecap = [...recap].sort((a, b) => b.averageFinalScore - a.averageFinalScore);

    const recapWithRank = recap.map((student) => {
      const rankIndex = sortedRecap.findIndex(s => s.averageFinalScore === student.averageFinalScore);
      return {
        ...student,
        rank: rankIndex + 1
      };
    });

    // Sort in-place by rank ascending, and alphabetically if ranks are equal
    recapWithRank.sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      return a.studentName.localeCompare(b.studentName);
    });

    return res.status(200).json({
      academicYear: {
        id: activeYear.id,
        year: activeYear.year,
        semester: activeYear.semester,
      },
      weight,
      recap: recapWithRank,
      schoolProfile: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const exportGradeRecap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeYear = await getActiveYear();
    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const weight = activeYear.gradeWeights[0] || { reportPercentage: 60.0, examPercentage: 40.0 };
    const rWeight = weight.reportPercentage / 100.0;
    const eWeight = weight.examPercentage / 100.0;

    const students = await prisma.student.findMany({
      orderBy: { name: 'asc' },
      include: {
        reportGrades: {
          where: { academicYearId: activeYear.id },
          include: { subject: true },
        },
        examGrades: {
          where: { academicYearId: activeYear.id },
          include: { subject: true },
        },
      },
    });

    const subjects = await prisma.subject.findMany({
      orderBy: [{ group: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    });

    const recapRaw = students.map((student) => {
      const reportGradesBySubject: Record<string, number[]> = {};
      student.reportGrades.forEach((rg) => {
        if (!reportGradesBySubject[rg.subjectId]) {
          reportGradesBySubject[rg.subjectId] = [];
        }
        reportGradesBySubject[rg.subjectId].push(rg.score);
      });

      const examGradesBySubject: Record<string, number> = {};
      student.examGrades.forEach((eg) => {
        examGradesBySubject[eg.subjectId] = eg.score;
      });

      let totalFinalScore = 0;
      let scoredSubjectsCount = 0;

      const subjectScores = subjects.map((sub) => {
        const reportScores = reportGradesBySubject[sub.id] || [];
        const reportAverage = reportScores.length > 0 
          ? reportScores.reduce((sum, score) => sum + score, 0) / reportScores.length 
          : 0;

        const examScore = examGradesBySubject[sub.id] ?? 0;
        const finalScore = (reportAverage * rWeight) + (examScore * eWeight);
        
        if (reportScores.length > 0 || examGradesBySubject[sub.id] !== undefined) {
          totalFinalScore += finalScore;
          scoredSubjectsCount++;
        }

        return {
          subjectId: sub.id,
          finalScore,
        };
      });

      const averageFinalScore = scoredSubjectsCount > 0 
        ? totalFinalScore / scoredSubjectsCount 
        : 0;

      return {
        nis: student.nis,
        nisn: student.nisn,
        studentName: student.name,
        gender: student.gender,
        subjectScores,
        totalFinalScore,
        averageFinalScore,
      };
    });

    const sortedRecap = [...recapRaw].sort((a, b) => b.averageFinalScore - a.averageFinalScore);

    const recapWithRank = recapRaw.map((student) => {
      const rankIndex = sortedRecap.findIndex(s => s.averageFinalScore === student.averageFinalScore);
      return {
        ...student,
        rank: rankIndex + 1
      };
    });

    // Sort in-place by rank ascending, and alphabetically if ranks are equal
    recapWithRank.sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      return a.studentName.localeCompare(b.studentName);
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekap Nilai Akhir');

    worksheet.views = [
      { state: 'frozen', xSplit: 4, ySplit: 1 }
    ];

    const columns: any[] = [
      { key: 'nis', width: 15 },
      { key: 'nisn', width: 15 },
      { key: 'name', width: 30 },
      { key: 'gender', width: 8 },
    ];

    subjects.forEach((sub) => {
      columns.push({
        key: `sub_${sub.id}`,
        width: 10
      });
    });

    columns.push({ key: 'total', width: 12 });
    columns.push({ key: 'avg', width: 12 });
    columns.push({ key: 'avg_round', width: 15 });
    columns.push({ key: 'rank', width: 10 });

    worksheet.columns = columns;

    const row1 = worksheet.getRow(1);
    row1.height = 30;

    row1.getCell(1).value = 'NIS';
    row1.getCell(2).value = 'NISN';
    row1.getCell(3).value = 'Nama Lengkap';
    row1.getCell(4).value = 'L/P';

    subjects.forEach((sub, idx) => {
      row1.getCell(5 + idx).value = sub.code;
    });

    const totalCols = 4 + subjects.length;
    row1.getCell(totalCols + 1).value = 'JUMLAH';
    row1.getCell(totalCols + 2).value = 'RATA-RATA';
    row1.getCell(totalCols + 3).value = 'RATA-RATA BULAT';
    row1.getCell(totalCols + 4).value = 'PERINGKAT';

    const headerBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'A0A0A0' } },
      left: { style: 'thin', color: { argb: 'A0A0A0' } },
      bottom: { style: 'thin', color: { argb: 'A0A0A0' } },
      right: { style: 'thin', color: { argb: 'A0A0A0' } }
    };

    const finalTotalCols = totalCols + 4;

    for (let c = 1; c <= finalTotalCols; c++) {
      const cell = row1.getCell(c);
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Arial', size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1F497D' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = headerBorder;
    }
    row1.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };

    // Hide unused columns
    for (let col = finalTotalCols + 1; col <= finalTotalCols + 100; col++) {
      worksheet.getColumn(col).hidden = true;
    }

    recapWithRank.forEach((student) => {
      const rowData: any = {
        nis: student.nis,
        nisn: student.nisn,
        name: student.studentName,
        gender: student.gender,
        total: student.totalFinalScore !== 0 ? Number(student.totalFinalScore.toFixed(0)) : '',
        avg: student.averageFinalScore !== 0 ? Number(student.averageFinalScore.toFixed(2)) : '',
        avg_round: student.averageFinalScore !== 0 ? Number(Math.round(student.averageFinalScore).toFixed(0)) : '',
        rank: student.rank
      };

      student.subjectScores.forEach((score) => {
        rowData[`sub_${score.subjectId}`] = score.finalScore !== 0 ? Number(score.finalScore.toFixed(0)) : '';
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

        if (colNumber === 3) {
          cell.alignment = { vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    const fileName = `rekap_nilai_akhir_${activeYear.year.replace('/', '_')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// Get list of all subjects
export const getMissingGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeYear = await getActiveYear();
    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const [students, subjects, existingReportGrades, existingExamGrades] = await Promise.all([
      prisma.student.findMany({ orderBy: { name: 'asc' } }),
      prisma.subject.findMany({ orderBy: [{ group: 'asc' }, { order: 'asc' }, { name: 'asc' }] }),
      prisma.reportGrade.findMany({
        where: { academicYearId: activeYear.id },
        select: { studentId: true, subjectId: true, semester: true },
      }),
      prisma.examGrade.findMany({
        where: { academicYearId: activeYear.id },
        select: { studentId: true, subjectId: true },
      }),
    ]);

    const SEMESTERS = [7, 8, 9, 10, 11];

    // Build lookup sets for fast O(1) checking
    const reportSet = new Set(
      existingReportGrades.map((g) => `${g.studentId}|${g.subjectId}|${g.semester}`)
    );
    const examSet = new Set(
      existingExamGrades.map((g) => `${g.studentId}|${g.subjectId}`)
    );

    const totalReportSlots = students.length * subjects.length * SEMESTERS.length;
    const totalExamSlots = students.length * subjects.length;
    const filledReportSlots = existingReportGrades.length;
    const filledExamSlots = existingExamGrades.length;

    const missingReportGrades: any[] = [];
    const missingExamGrades: any[] = [];

    for (const student of students) {
      for (const subject of subjects) {
        // Check missing report grades
        const missingSemesters = SEMESTERS.filter(
          (sem) => !reportSet.has(`${student.id}|${subject.id}|${sem}`)
        );
        if (missingSemesters.length > 0) {
          missingReportGrades.push({
            studentId: student.id,
            studentName: student.name,
            nis: student.nis,
            nisn: student.nisn,
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            subjectGroup: subject.group,
            missingSemesters,
          });
        }

        // Check missing exam grades
        if (!examSet.has(`${student.id}|${subject.id}`)) {
          missingExamGrades.push({
            studentId: student.id,
            studentName: student.name,
            nis: student.nis,
            nisn: student.nisn,
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            subjectGroup: subject.group,
          });
        }
      }
    }

    return res.status(200).json({
      academicYear: {
        id: activeYear.id,
        year: activeYear.year,
        semester: activeYear.semester,
      },
      summary: {
        totalStudents: students.length,
        totalSubjects: subjects.length,
        totalReportSlots,
        filledReportSlots,
        missingReportSlots: totalReportSlots - filledReportSlots,
        totalExamSlots,
        filledExamSlots,
        missingExamSlots: totalExamSlots - filledExamSlots,
        reportCompletionPct:
          totalReportSlots > 0
            ? Math.round((filledReportSlots / totalReportSlots) * 100)
            : 100,
        examCompletionPct:
          totalExamSlots > 0
            ? Math.round((filledExamSlots / totalExamSlots) * 100)
            : 100,
      },
      missingReportGrades,
      missingExamGrades,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: [{ group: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    });
    return res.status(200).json(subjects);
  } catch (error) {
    next(error);
  }
};

// Export Report template or existing grades for ALL Subjects
export const exportAllReportGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { semester } = req.query;
    const activeYear = await getActiveYear();
    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const subjects = await prisma.subject.findMany({
      orderBy: [
        { group: 'asc' },
        { order: 'asc' },
        { name: 'asc' }
      ]
    });

    const targetSemester = semester ? parseInt(String(semester)) : null;

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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Nilai Rapor Semua Mapel');

    // Freeze A-C (NIS, NISN, Name) and first 2 header rows
    worksheet.views = [
      { state: 'frozen', xSplit: 3, ySplit: 2 }
    ];

    // Define base columns
    const columns: any[] = [
      { key: 'nis', width: 15 },
      { key: 'nisn', width: 15 },
      { key: 'name', width: 30 }
    ];

    // Add columns for each subject
    subjects.forEach((subj) => {
      if (targetSemester) {
        columns.push({
          key: `${subj.code}_sem${targetSemester}`,
          width: 12
        });
      } else {
        for (let sem = 7; sem <= 11; sem++) {
          columns.push({
            key: `${subj.code}_sem${sem}`,
            width: 10
          });
        }
      }
    });

    worksheet.columns = columns;

    // Build Row 1 (Subjects)
    const row1 = worksheet.getRow(1);
    row1.height = 30;
    row1.getCell(1).value = 'NIS';
    row1.getCell(2).value = 'NISN';
    row1.getCell(3).value = 'Nama Lengkap';

    subjects.forEach((subj, i) => {
      if (targetSemester) {
        const colIdx = 4 + i;
        const cell = row1.getCell(colIdx);
        cell.value = `[${subj.code}] ${subj.name}`;
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Arial', size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1F497D' } // Navy blue
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      } else {
        const startCol = 4 + i * 5;
        const endCol = startCol + 4;
        worksheet.mergeCells(1, startCol, 1, endCol);
        const cell = row1.getCell(startCol);
        cell.value = `[${subj.code}] ${subj.name}`;
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Arial', size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1F497D' } // Navy blue
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }
    });

    // Style NIS, NISN, Nama headers on Row 1
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

    // Build Row 2 (Semesters)
    const row2 = worksheet.getRow(2);
    row2.height = 25;
    row2.getCell(1).value = '';
    row2.getCell(2).value = '';
    row2.getCell(3).value = '';

    subjects.forEach((subj, i) => {
      if (targetSemester) {
        const colIdx = 4 + i;
        const cell = row2.getCell(colIdx);
        cell.value = `Smt ${targetSemester}`;
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Arial', size: 10 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '5B9BD5' } // Lighter blue
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        const startCol = 4 + i * 5;
        for (let sem = 7; sem <= 11; sem++) {
          const colIdx = startCol + (sem - 7);
          const cell = row2.getCell(colIdx);
          cell.value = `Smt ${sem}`;
          cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Arial', size: 10 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '5B9BD5' } // Lighter blue
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
    });

    // Style empty Row 2 cells for NIS, NISN, Nama to match Row 1 header style
    for (let c = 1; c <= 3; c++) {
      const cell = row2.getCell(c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1F497D' }
      };
    }

    // Apply borders to all active cells in Row 1 and Row 2 (including merged ones)
    const totalCols = targetSemester ? (3 + subjects.length) : (3 + subjects.length * 5);
    const headerBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'A0A0A0' } },
      left: { style: 'thin', color: { argb: 'A0A0A0' } },
      bottom: { style: 'thin', color: { argb: 'A0A0A0' } },
      right: { style: 'thin', color: { argb: 'A0A0A0' } }
    };

    for (let col = 1; col <= totalCols; col++) {
      row1.getCell(col).border = headerBorder;
      row2.getCell(col).border = headerBorder;
    }

    // Hide all unused columns to the right of the active columns
    for (let col = totalCols + 1; col <= totalCols + 100; col++) {
      worksheet.getColumn(col).hidden = true;
    }

    // Add Student Rows
    students.forEach((student) => {
      const rowData: any = {
        nis: student.nis,
        nisn: student.nisn,
        name: student.name
      };

      // Map existing grades
      subjects.forEach((subj) => {
        if (targetSemester) {
          const matchingGrade = student.reportGrades.find(
            (rg) => rg.subjectId === subj.id && rg.semester === targetSemester
          );
          rowData[`${subj.code}_sem${targetSemester}`] = matchingGrade ? matchingGrade.score : '';
        } else {
          for (let sem = 7; sem <= 11; sem++) {
            const matchingGrade = student.reportGrades.find(
              (rg) => rg.subjectId === subj.id && rg.semester === sem
            );
            rowData[`${subj.code}_sem${sem}`] = matchingGrade ? matchingGrade.score : '';
          }
        }
      });

      const newRow = worksheet.addRow(rowData);
      newRow.height = 20;

      // Add borders and formatting
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

    const fileSemesterSuffix = targetSemester ? `_smt_${targetSemester}` : '';
    const fileName = `nilai_rapor_semua_mapel${fileSemesterSuffix}.xlsx`;

    // Write file to response
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${fileName}`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// Import Report card grades for ALL Subjects
export const importAllReportGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No Excel file uploaded' });
    }

    const activeYear = await getActiveYear();
    if (!activeYear) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Worksheet not found' });
    }

    const subjects = await prisma.subject.findMany();
    const colToSubjectId: Record<number, string> = {};

    // Scan Row 1 cells to map column indices to subjectIds dynamically
    const row1 = worksheet.getRow(1);
    let currentSubjectId: string | null = null;

    for (let col = 4; col <= worksheet.columnCount; col++) {
      const val = row1.getCell(col).value;
      if (val) {
        const valStr = String(val).trim().toLowerCase();
        const foundSubj = subjects.find(
          (subj) =>
            valStr === subj.name.trim().toLowerCase() ||
            valStr.includes(subj.code.trim().toLowerCase()) ||
            valStr.includes(subj.name.trim().toLowerCase())
        );
        if (foundSubj) {
          currentSubjectId = foundSubj.id;
        }
      }
      if (currentSubjectId) {
        colToSubjectId[col] = currentSubjectId;
      }
    }

    const parseSemester = (val: any): number | null => {
      if (!val) return null;
      const str = String(val).trim();
      const match = str.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    };

    const row2 = worksheet.getRow(2);
    const colToSemester: Record<number, number> = {};
    for (let col = 4; col <= worksheet.columnCount; col++) {
      const semVal = row2.getCell(col).value;
      const semNum = parseSemester(semVal);
      if (semNum !== null) {
        colToSemester[col] = semNum;
      }
    }

    const gradesToUpsert: any[] = [];
    const errors: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return; // Skip the first 2 header rows

      const nis = getCellValueAsString(row.getCell(1));
      const name = getCellValueAsString(row.getCell(3));

      if (!nis && !name) return; // Empty row, skip

      // Iterate through columns starting from column 4
      for (let col = 4; col <= worksheet.columnCount; col++) {
        const cellValue = row.getCell(col).value;
        if (cellValue === null || cellValue === undefined || String(cellValue).trim() === '') {
          continue; // Empty grade is fine, skip
        }

        const subjectId = colToSubjectId[col];
        const semester = colToSemester[col];

        if (!subjectId || !semester) {
          continue; // Not a mapped grade column, skip
        }

        const score = Number(cellValue);
        if (isNaN(score) || score < 0 || score > 100) {
          const subjName = subjects.find(s => s.id === subjectId)?.name || 'Unknown';
          errors.push(`Row ${rowNumber}: Subject '${subjName}' Semester ${semester} score must be a number between 0 and 100.`);
          continue;
        }

        gradesToUpsert.push({
          nis,
          subjectId,
          semester,
          score,
        });
      }
    });

    if (errors.length > 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Excel parsing validation errors', errors });
    }

    let savedCount = 0;
    const dbErrors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of gradesToUpsert) {
        const student = await tx.student.findUnique({ where: { nis: item.nis } });
        if (!student) {
          throw new Error(`Student with NIS '${item.nis}' not found in the database.`);
        }

        await tx.reportGrade.upsert({
          where: {
            studentId_subjectId_academicYearId_semester: {
              studentId: student.id,
              subjectId: item.subjectId,
              academicYearId: activeYear.id,
              semester: item.semester,
            },
          },
          update: { score: item.score },
          create: {
            studentId: student.id,
            subjectId: item.subjectId,
            academicYearId: activeYear.id,
            semester: item.semester,
            score: item.score,
          },
        });
        savedCount++;
      }
    }).catch((err) => {
      dbErrors.push(err.message);
    });

    fs.unlinkSync(req.file.path);

    if (dbErrors.length > 0) {
      return res.status(400).json({ message: 'Import failed', errors: dbErrors });
    }

    return res.status(200).json({
      message: `Successfully imported ${savedCount} report card grades for all subjects.`,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// Export Exam template or existing grades for ALL Subjects
export const exportAllExamGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeYear = await getActiveYear();
    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const subjects = await prisma.subject.findMany({
      orderBy: [
        { group: 'asc' },
        { order: 'asc' },
        { name: 'asc' }
      ]
    });

    const students = await prisma.student.findMany({
      orderBy: { name: 'asc' },
      include: {
        examGrades: {
          where: {
            academicYearId: activeYear.id
          }
        }
      }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Nilai Ujian Semua Mapel');

    // Freeze A-C (NIS, NISN, Name) and the header row
    worksheet.views = [
      { state: 'frozen', xSplit: 3, ySplit: 1 }
    ];

    // Define base columns
    const columns: any[] = [
      { key: 'nis', width: 15 },
      { key: 'nisn', width: 15 },
      { key: 'name', width: 30 }
    ];

    // Add 1 column for each subject
    subjects.forEach((subj) => {
      columns.push({
        key: `sub_${subj.id}`,
        width: 15
      });
    });

    worksheet.columns = columns;

    const row1 = worksheet.getRow(1);
    row1.height = 30;
    row1.getCell(1).value = 'NIS';
    row1.getCell(2).value = 'NISN';
    row1.getCell(3).value = 'Nama Lengkap';

    subjects.forEach((subj, i) => {
      const colNum = 4 + i;
      row1.getCell(colNum).value = subj.code;
    });

    const headerBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'A0A0A0' } },
      left: { style: 'thin', color: { argb: 'A0A0A0' } },
      bottom: { style: 'thin', color: { argb: 'A0A0A0' } },
      right: { style: 'thin', color: { argb: 'A0A0A0' } }
    };

    const totalCols = 3 + subjects.length;

    for (let c = 1; c <= totalCols; c++) {
      const cell = row1.getCell(c);
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Arial', size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1F497D' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = headerBorder;
    }
    row1.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };

    // Hide all unused columns to the right
    for (let col = totalCols + 1; col <= totalCols + 100; col++) {
      worksheet.getColumn(col).hidden = true;
    }

    // Add Student Rows
    students.forEach((student) => {
      const rowData: any = {
        nis: student.nis,
        nisn: student.nisn,
        name: student.name
      };

      subjects.forEach((subj) => {
        const matchingGrade = student.examGrades.find(
          (eg) => eg.subjectId === subj.id
        );
        rowData[`sub_${subj.id}`] = matchingGrade ? matchingGrade.score : '';
      });

      const newRow = worksheet.addRow(rowData);
      newRow.height = 20;

      // Add borders and formatting
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

    const fileName = `nilai_ujian_semua_mapel.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// Import Exam grades for ALL Subjects
export const importAllExamGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No Excel file uploaded' });
    }

    const activeYear = await getActiveYear();
    if (!activeYear) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Worksheet not found' });
    }

    const subjects = await prisma.subject.findMany();
    const colToSubjectId: Record<number, string> = {};

    // Scan Row 1 cells to map column indices to subjectIds
    const row1 = worksheet.getRow(1);
    for (let col = 4; col <= worksheet.columnCount; col++) {
      const val = row1.getCell(col).value;
      if (val) {
        const valStr = String(val).trim().toLowerCase();
        const matchedSub = subjects.find(
          (subj) =>
            valStr === subj.code.trim().toLowerCase() ||
            valStr === subj.name.trim().toLowerCase() ||
            valStr.includes(subj.code.trim().toLowerCase()) ||
            valStr.includes(subj.name.trim().toLowerCase())
        );
        if (matchedSub) {
          colToSubjectId[col] = matchedSub.id;
        }
      }
    }

    const gradesToUpsert: any[] = [];
    const errors: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return; // Skip header row

      const nis = getCellValueAsString(row.getCell(1));
      const name = getCellValueAsString(row.getCell(3));

      if (!nis && !name) return; // Empty row, skip

      // Iterate through columns starting from column 4
      for (let col = 4; col <= worksheet.columnCount; col++) {
        const cellValue = row.getCell(col).value;
        if (cellValue === null || cellValue === undefined || String(cellValue).trim() === '') {
          continue; // Empty grade is fine, skip
        }

        const subjectId = colToSubjectId[col];
        if (!subjectId) {
          continue; // Not a mapped grade column, skip
        }

        const score = Number(cellValue);
        if (isNaN(score) || score < 0 || score > 100) {
          const subjName = subjects.find(s => s.id === subjectId)?.name || 'Unknown';
          errors.push(`Row ${rowNumber}: Subject '${subjName}' exam score must be a number between 0 and 100.`);
          continue;
        }

        gradesToUpsert.push({
          nis,
          subjectId,
          score,
        });
      }
    });

    if (errors.length > 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Excel parsing validation errors', errors });
    }

    let savedCount = 0;
    const dbErrors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of gradesToUpsert) {
        const student = await tx.student.findUnique({ where: { nis: item.nis } });
        if (!student) {
          throw new Error(`Student with NIS '${item.nis}' not found in the database.`);
        }

        await tx.examGrade.upsert({
          where: {
            studentId_subjectId_academicYearId: {
              studentId: student.id,
              subjectId: item.subjectId,
              academicYearId: activeYear.id,
            },
          },
          update: { score: item.score },
          create: {
            studentId: student.id,
            subjectId: item.subjectId,
            academicYearId: activeYear.id,
            score: item.score,
          },
        });
        savedCount++;
      }
    }).catch((err) => {
      dbErrors.push(err.message);
    });

    fs.unlinkSync(req.file.path);

    if (dbErrors.length > 0) {
      return res.status(400).json({ message: 'Import failed', errors: dbErrors });
    }

    return res.status(200).json({
      message: `Successfully imported ${savedCount} exam grades for all subjects.`,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

