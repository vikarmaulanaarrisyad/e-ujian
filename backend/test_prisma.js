const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true }
  });

  const students = await prisma.student.findMany({
    where: { isGraduated: true },
    include: {
      examGrades: {
        where: { academicYearId: activeYear.id }
      }
    },
    take: 1
  });

  if (!students.length) return console.log('no students');

  const s = students[0];
  const subjects = await prisma.subject.findMany();
  
  const examGradesBySubject = {};
  s.examGrades.forEach((eg) => {
    examGradesBySubject[eg.subjectId] = eg.score;
  });

  const grades = subjects.map((subject) => ({
    subjectId: subject.id,
    subjectName: subject.name,
    examScore: Number((examGradesBySubject[subject.id] || 0).toFixed(2)),
  }));

  const validGrades = grades.filter(g => g.examScore > 0);
  const totalExamScore = validGrades.reduce((acc, curr) => acc + curr.examScore, 0);
  const averageExamScore = validGrades.length > 0 ? Number((totalExamScore / validGrades.length).toFixed(2)) : 0;

  console.log('Grades:', grades);
  console.log('Valid Grades Length:', validGrades.length);
  console.log('Total Score:', totalExamScore);
  console.log('Average Score:', averageExamScore);
}

main().catch(console.error).finally(() => prisma.$disconnect());
