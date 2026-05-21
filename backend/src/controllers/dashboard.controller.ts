import { Request, Response, NextFunction } from 'express';
import prisma from '../db';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true }
    });
    
    // 1. Total Students
    const totalStudents = await prisma.student.count();
    
    // 2. Gender distribution
    const maleStudents = await prisma.student.count({ where: { gender: 'L' } });
    const femaleStudents = await prisma.student.count({ where: { gender: 'P' } });
    
    // 3. Graduation Status
    const graduatedStudents = await prisma.student.count({ where: { isGraduated: true } });
    const notGraduatedStudents = await prisma.student.count({ where: { isGraduated: false } });
    
    // 4. Grades averages (if active year exists)
    let avgReport = 0;
    let avgExam = 0;
    
    if (activeYear) {
      const reportAgg = await prisma.reportGrade.aggregate({
        where: { academicYearId: activeYear.id },
        _avg: { score: true }
      });
      avgReport = reportAgg._avg.score || 0;
      
      const examAgg = await prisma.examGrade.aggregate({
        where: { academicYearId: activeYear.id },
        _avg: { score: true }
      });
      avgExam = examAgg._avg.score || 0;
    }
    
    // Calculate pass rate
    const passRate = totalStudents > 0 ? (graduatedStudents / totalStudents) * 100 : 0;

    return res.status(200).json({
      activeAcademicYear: activeYear ? {
        year: activeYear.year,
        semester: activeYear.semester
      } : null,
      students: {
        total: totalStudents,
        male: maleStudents,
        female: femaleStudents,
      },
      graduation: {
        graduated: graduatedStudents,
        notGraduated: notGraduatedStudents,
        passRate: passRate,
      },
      averages: {
        report: Number(avgReport.toFixed(2)),
        exam: Number(avgExam.toFixed(2)),
      }
    });
  } catch (error) {
    next(error);
  }
};
