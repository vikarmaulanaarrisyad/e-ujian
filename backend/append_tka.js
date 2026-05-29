const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'document.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

const newCode = `

export const getBatchTkaStatementData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user.tenantId;
    
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true, tenantId },
      include: { gradeWeights: true },
    });

    if (!activeYear) {
      return res.status(404).json({ message: 'Tidak ada tahun ajaran aktif.' });
    }

    let profile: any = await prisma.schoolProfile.findUnique({ where: { tenantId }, include: { tenant: true } }) || defaultProfile();
    profile = resolveLogoUrl({ ...profile }, req);

    const students = await prisma.student.findMany({
      where: { tenantId, isGraduated: false },
      include: {
        tkaGrades: {
          where: { academicYearId: activeYear.id },
        }
      },
      orderBy: { name: 'asc' },
    });

    if (students.length === 0) {
      return res.status(404).json({ message: 'Tidak ada siswa aktif.' });
    }

    return res.status(200).json({
      students: students.map((s) => {
        let mathScore = 0;
        let indoScore = 0;
        
        s.tkaGrades.forEach((grade: any) => {
          if (grade.subjectType === 'MATEMATIKA') mathScore = grade.score;
          if (grade.subjectType === 'BAHASA_INDONESIA') indoScore = grade.score;
        });

        return {
          id: s.id,
          nis: s.nis,
          nisn: s.nisn,
          name: s.name,
          placeOfBirth: s.placeOfBirth,
          dateOfBirth: s.dateOfBirth,
          mathScore,
          indoScore,
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

if (!content.includes('getBatchTkaStatementData')) {
  fs.writeFileSync(filePath, content + newCode);
  console.log('Successfully appended getBatchTkaStatementData');
} else {
  console.log('Already exists');
}
