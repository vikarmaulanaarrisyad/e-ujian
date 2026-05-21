import { Request, Response, NextFunction } from 'express';
import prisma from '../db';

// Helper: build a default school profile object
const defaultProfile = () => ({
  id: 'default',
  name: 'MI Bustanul Huda Dawuhan',
  npsn: '20512345',
  address: 'Jl. Contoh Alamat No. 123, Dawuhan, Jawa Timur',
  headmaster: 'H. Fulan, S.Pd.I',
  headmasterNip: '19700101 200003 1 001',
  city: null,
  logoUrl: null,
  sklNumberFormat: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Helper: make logoUrl absolute
const resolveLogoUrl = (profile: any, req: Request) => {
  if (profile.logoUrl && !profile.logoUrl.startsWith('http')) {
    const host = req.get('host');
    const protocol = req.protocol;
    profile.logoUrl = `${protocol}://${host}${profile.logoUrl}`;
  }
  return profile;
};

export const getStudentDocumentData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Fetch active academic year and grade weights
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      include: { gradeWeights: true },
    });

    if (!activeYear) {
      return res.status(404).json({ message: 'Tidak ada tahun ajaran aktif.' });
    }

    const weight = activeYear.gradeWeights[0] || { reportPercentage: 60.0, examPercentage: 40.0 };
    const rWeight = weight.reportPercentage / 100.0;
    const eWeight = weight.examPercentage / 100.0;

    // Fetch school profile
    let profile: any = await prisma.schoolProfile.findFirst() || defaultProfile();
    profile = resolveLogoUrl({ ...profile }, req);

    // Fetch student with all their grades
    const student = await prisma.student.findUnique({
      where: { id },
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

    if (!student) {
      return res.status(404).json({ message: 'Siswa tidak ditemukan.' });
    }

    if (!student.isGraduated) {
      return res.status(400).json({ message: 'Siswa belum diluluskan.' });
    }

    // Fetch all subjects to build a complete list of grades
    const subjects = await prisma.subject.findMany({
      orderBy: [{ group: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    });

    // Group report grades by subject
    const reportGradesBySubject: Record<string, number[]> = {};
    student.reportGrades.forEach((rg) => {
      if (!reportGradesBySubject[rg.subjectId]) {
        reportGradesBySubject[rg.subjectId] = [];
      }
      reportGradesBySubject[rg.subjectId].push(rg.score);
    });

    // Group exam grades by subject
    const examGradesBySubject: Record<string, number> = {};
    student.examGrades.forEach((eg) => {
      examGradesBySubject[eg.subjectId] = eg.score;
    });

    // Calculate final grades per subject
    const grades = subjects.map((subject) => {
      const subjectReportScores = reportGradesBySubject[subject.id] || [];

      let averageReport = 0;
      if (subjectReportScores.length > 0) {
        const sum = subjectReportScores.reduce((acc, curr) => acc + curr, 0);
        averageReport = sum / subjectReportScores.length;
      }

      const examScore = examGradesBySubject[subject.id] || 0;
      const finalScore = (averageReport * rWeight) + (examScore * eWeight);

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectGroup: subject.group,
        averageReport: Number(averageReport.toFixed(2)),
        examScore: Number(examScore.toFixed(2)),
        finalScore: Number(finalScore.toFixed(2)),
      };
    });

    // Calculate total average
    let totalFinalScore = 0;
    if (grades.length > 0) {
      totalFinalScore = grades.reduce((acc, curr) => acc + curr.finalScore, 0);
    }
    const averageFinalScore = grades.length > 0 ? Number((totalFinalScore / grades.length).toFixed(2)) : 0;

    return res.status(200).json({
      student: {
        id: student.id,
        nis: student.nis,
        nisn: student.nisn,
        name: student.name,
        gender: student.gender,
        placeOfBirth: student.placeOfBirth,
        dateOfBirth: student.dateOfBirth,
        parentName: student.parentName,
        isGraduated: student.isGraduated,
        graduationDate: student.graduationDate,
        certificateNumber: student.certificateNumber,
        sklNumber: student.sklNumber,
      },
      schoolProfile: profile,
      grades,
      averageFinalScore,
      academicYear: activeYear.year,
    });
  } catch (error) {
    next(error);
  }
};

// Get all graduated students data for batch SKL printing
export const getAllGraduatedSklData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Fetch active academic year
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      include: { gradeWeights: true },
    });

    if (!activeYear) {
      return res.status(404).json({ message: 'Tidak ada tahun ajaran aktif.' });
    }

    // Fetch school profile
    let profile: any = await prisma.schoolProfile.findFirst() || defaultProfile();
    profile = resolveLogoUrl({ ...profile }, req);

    // Fetch all graduated students ordered by sklNumber then name
    const students = await prisma.student.findMany({
      where: { isGraduated: true },
      orderBy: [{ sklNumber: 'asc' }, { name: 'asc' }],
    });

    if (students.length === 0) {
      return res.status(404).json({ message: 'Tidak ada siswa yang berstatus lulus.' });
    }

    return res.status(200).json({
      students: students.map((s) => ({
        id: s.id,
        nis: s.nis,
        nisn: s.nisn,
        name: s.name,
        gender: s.gender,
        placeOfBirth: s.placeOfBirth,
        dateOfBirth: s.dateOfBirth,
        parentName: s.parentName,
        isGraduated: s.isGraduated,
        graduationDate: s.graduationDate,
        certificateNumber: s.certificateNumber,
        sklNumber: s.sklNumber,
      })),
      schoolProfile: profile,
      academicYear: activeYear.year,
    });
  } catch (error) {
    next(error);
  }
};
