const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
    include: { gradeWeights: true }
  });

  const students = await prisma.student.findMany({
    where: { isGraduated: true },
    include: {
      reportGrades: {
        where: { academicYearId: activeYear.id }
      },
      examGrades: {
        where: { academicYearId: activeYear.id }
      }
    },
    take: 1
  });

  if (!students.length) return console.log('no students');

  const student = students[0];
  const subjects = await prisma.subject.findMany();
  
  let rWeight = 0.6;
  let eWeight = 0.4;
  if (activeYear.gradeWeights && activeYear.gradeWeights.length > 0) {
    rWeight = activeYear.gradeWeights[0].reportWeight / 100;
    eWeight = activeYear.gradeWeights[0].examWeight / 100;
  }

  const examGradesBySubject = {};
  student.examGrades.forEach((eg) => {
    examGradesBySubject[eg.subjectId] = eg.score;
  });

  const grades = subjects.map((subject) => {
    const reportGrades = student.reportGrades.filter((rg) => rg.subjectId === subject.id);
    const totalReport = reportGrades.reduce((acc, curr) => acc + curr.score, 0);
    const averageReport = reportGrades.length > 0 ? totalReport / reportGrades.length : 0;

    const examScore = examGradesBySubject[subject.id] || 0;
    const finalScore = (averageReport * rWeight) + (examScore * eWeight);

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      averageReport: Number(averageReport.toFixed(2)),
      examScore: Number(examScore.toFixed(2)),
      finalScore: Number(finalScore.toFixed(2)),
    };
  });

  let totalFinalScore = 0;
  let totalExamScore = 0;
  if (grades.length > 0) {
    totalFinalScore = grades.reduce((acc, curr) => acc + curr.finalScore, 0);
    totalExamScore = grades.reduce((acc, curr) => acc + curr.examScore, 0);
  }
  const averageFinalScore = grades.length > 0 ? Number((totalFinalScore / grades.length).toFixed(2)) : 0;
  const averageExamScore = grades.length > 0 ? Number((totalExamScore / grades.length).toFixed(2)) : 0;

  console.log('Average Exam Score:', averageExamScore);
  const nanGrades = grades.filter(g => isNaN(g.examScore) || isNaN(g.finalScore));
  console.log('NaN Grades:', nanGrades);
}

main().catch(console.error).finally(() => prisma.$disconnect());
