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
    const tenantId = (req as any).user.tenantId;

    // Fetch active academic year and grade weights
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true, tenantId },
      include: { gradeWeights: true },
    });

    if (!activeYear) {
      return res.status(404).json({ message: 'Tidak ada tahun ajaran aktif.' });
    }

    const weight = activeYear.gradeWeights[0] || { reportPercentage: 60.0, examPercentage: 40.0 };
    const rWeight = weight.reportPercentage / 100.0;
    const eWeight = weight.examPercentage / 100.0;

    // Fetch school profile
    let profile: any = await prisma.schoolProfile.findUnique({ where: { tenantId }, include: { tenant: true } }) || defaultProfile();
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
      where: { tenantId },
      orderBy: [{ group: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    });

    const activeSemestersStr = weight.activeSemesters || "7,8,9,10,11";
    const activeSemesters = activeSemestersStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

    // Group report grades by subject (only if semester is in activeSemesters)
    const reportGradesBySubject: Record<string, number[]> = {};
    student.reportGrades.forEach((rg) => {
      if (activeSemesters.includes(rg.semester)) {
        if (!reportGradesBySubject[rg.subjectId]) {
          reportGradesBySubject[rg.subjectId] = [];
        }
        reportGradesBySubject[rg.subjectId].push(rg.score);
      }
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
    const tenantId = (req as any).user.tenantId;
    // Fetch active academic year
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true, tenantId },
      include: { gradeWeights: true },
    });

    if (!activeYear) {
      return res.status(404).json({ message: 'Tidak ada tahun ajaran aktif.' });
    }

    // Fetch school profile
    let profile: any = await prisma.schoolProfile.findUnique({ where: { tenantId }, include: { tenant: true } }) || defaultProfile();
    profile = resolveLogoUrl({ ...profile }, req);

    // Fetch all graduated students ordered by sklNumber then name
    const students = await prisma.student.findMany({
      where: { isGraduated: true, tenantId },
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

export const getStudentSknrData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { semesters } = req.query;
    const tenantId = (req as any).user.tenantId;

    let activeSemesters = [7, 8, 9, 10, 11];
    if (typeof semesters === 'string' && semesters.trim() !== '') {
      activeSemesters = semesters.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    }

    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true, tenantId },
      include: { gradeWeights: true },
    });

    if (!activeYear) {
      return res.status(404).json({ message: 'Tidak ada tahun ajaran aktif.' });
    }

    let profile: any = await prisma.schoolProfile.findUnique({ where: { tenantId }, include: { tenant: true } }) || defaultProfile();
    profile = resolveLogoUrl({ ...profile }, req);

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        reportGrades: {
          include: { subject: true },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Siswa tidak ditemukan.' });
    }

    const validReportGrades = student.reportGrades.filter(rg => activeSemesters.includes(rg.semester));
    
    const subjectsMap = new Map<string, any>();
    
    validReportGrades.forEach(rg => {
      const lowerName = rg.subject.name.toLowerCase();
      const isAgama = 
        lowerName.includes('quran') || lowerName.includes('qur\'an') || lowerName.includes('qur`an') || lowerName.includes('hadis') || lowerName.includes('hadits') ||
        lowerName.includes('akidah') || lowerName.includes('aqidah') ||
        lowerName.includes('fikih') || lowerName.includes('fiqih') ||
        lowerName.includes('sejarah kebudayaan islam') || lowerName === 'ski';

      const mapKey = isAgama ? 'agama_group' : rg.subject.id;
      const mapName = isAgama ? 'Pendidikan Agama dan Budi Pekerti' : rg.subject.name;
      const mapOrder = isAgama ? -1 : (rg.subject.order || 0); // -1 to force it to top

      if (!subjectsMap.has(mapKey)) {
        subjectsMap.set(mapKey, {
          subjectId: mapKey,
          subjectName: mapName,
          order: mapOrder,
          semesterScores: {} as Record<number, { sum: number, count: number }>,
        });
      }
      const subj = subjectsMap.get(mapKey);
      if (!subj.semesterScores[rg.semester]) {
        subj.semesterScores[rg.semester] = { sum: 0, count: 0 };
      }
      subj.semesterScores[rg.semester].sum += rg.score;
      subj.semesterScores[rg.semester].count += 1;
    });

    const subjectList = Array.from(subjectsMap.values()).map(subj => {
      const finalScores: Record<number, number> = {};
      let totalSum = 0;
      let totalCount = 0;

      for (const semStr of Object.keys(subj.semesterScores)) {
        const sem = parseInt(semStr, 10);
        const { sum, count } = subj.semesterScores[sem];
        const avg = count > 0 ? (sum / count) : 0;
        finalScores[sem] = avg;
        totalSum += avg;
        totalCount += 1;
      }

      return {
        subjectName: subj.subjectName,
        scores: finalScores,
        average: totalCount > 0 ? (totalSum / totalCount) : 0,
        order: subj.order
      };
    });

    subjectList.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.subjectName.localeCompare(b.subjectName);
    });

    let totalAverage = 0;
    if (subjectList.length > 0) {
      const sumAllAverages = subjectList.reduce((acc, curr) => acc + curr.average, 0);
      totalAverage = sumAllAverages / subjectList.length;
    }

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
      sknrDetails: {
        activeSemesters,
        subjects: subjectList,
        totalAverage: Number(totalAverage.toFixed(2)),
      },
      academicYear: activeYear.year,
    });
  } catch (error) {
    next(error);
  }
};
