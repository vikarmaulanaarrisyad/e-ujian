const fs = require('fs');

const file = 'e:/NEXTJS/e-ujian/backend/src/controllers/document.controller.ts';
let content = fs.readFileSync(file, 'utf8');

// The helper to insert
const helper = `
// Helper function to process SKNR grades
const processSknrGrades = (reportGrades: any[], activeSemesters: number[]) => {
  const validReportGrades = reportGrades.filter((rg: any) => activeSemesters.includes(rg.semester));
  const subjectsMap = new Map<string, any>();
  
  validReportGrades.forEach((rg: any) => {
    const lowerName = rg.subject.name.toLowerCase();
    const isAgama = 
      lowerName.includes('quran') || lowerName.includes("qur'an") || lowerName.includes('qur\`an') || lowerName.includes('hadis') || lowerName.includes('hadits') ||
      lowerName.includes('akidah') || lowerName.includes('aqidah') ||
      lowerName.includes('fikih') || lowerName.includes('fiqih') ||
      lowerName.includes('sejarah kebudayaan islam') || lowerName === 'ski';

    const mapKey = isAgama ? 'agama_group' : rg.subject.id;
    const mapName = isAgama ? 'Pendidikan Agama dan Budi Pekerti' : rg.subject.name;
    const mapOrder = isAgama ? -1 : (rg.subject.order || 0);

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

  return {
    subjects: subjectList,
    totalAverage: Number(totalAverage.toFixed(2)),
  };
};

export const getAllGraduatedSknrData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { semesters } = req.query;

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
    profile = resolveUrls({ ...profile }, req as any);

    const students = await prisma.student.findMany({
      where: { isGraduated: true, tenantId },
      include: {
        reportGrades: {
          include: { subject: true },
        },
      },
      orderBy: [{ sklNumber: 'asc' }, { name: 'asc' }],
    });

    if (students.length === 0) {
      return res.status(404).json({ message: 'Tidak ada siswa yang berstatus lulus.' });
    }

    return res.status(200).json({
      students: students.map((student) => {
        const { subjects, totalAverage } = processSknrGrades(student.reportGrades, activeSemesters);
        return {
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
          sknrNumber: student.sknrNumber,
          photoUrl: student.photoUrl,
          sknrDetails: {
            activeSemesters,
            subjects,
            totalAverage,
          }
        };
      }),
      schoolProfile: profile,
      academicYear: activeYear.year,
    });
  } catch (error) {
    next(error);
  }
};
`;

// Now replace the content in getStudentSknrData
// from: const validReportGrades = ...
// to: totalAverage = sumAllAverages / subjectList.length; }
const startStr = "const validReportGrades = student.reportGrades.filter(rg => activeSemesters.includes(rg.semester));";
const endStr = "totalAverage = sumAllAverages / subjectList.length;\n    }";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr) + endStr.length;

if (startIndex !== -1 && endIndex > startIndex) {
  content = content.substring(0, startIndex) + 
            "const { subjects, totalAverage } = processSknrGrades(student.reportGrades, activeSemesters);" + 
            content.substring(endIndex);
            
  // update the variable names in the json return
  content = content.replace("subjects: subjectList,", "subjects: subjects,");
  content = content.replace("totalAverage: Number(totalAverage.toFixed(2)),", "totalAverage: totalAverage,");
  
  // append helper at end
  content += "\n" + helper;
  
  fs.writeFileSync(file, content);
  console.log("Success");
} else {
  console.log("Could not find replacement bounds");
}
