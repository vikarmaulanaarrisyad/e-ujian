const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function m() {
  const activeYear = await prisma.academicYear.findFirst({where: {isActive: true}});
  const students = await prisma.student.findMany({
    where: {isGraduated: true},
    include: {examGrades: {where: {academicYearId: activeYear.id}}},
    take: 1
  });
  const s = students[0];
  const subjects = await prisma.subject.findMany();
  
  const examGradesBySubject = {};
  s.examGrades.forEach(eg => examGradesBySubject[eg.subjectId] = eg.score);
  
  const grades = subjects.map(subject => ({
    examScore: Number((examGradesBySubject[subject.id] || 0).toFixed(2))
  }));
  
  const validGrades = grades.filter(g => g.examScore > 0);
  const totalExamScore = validGrades.reduce((acc, curr) => acc + curr.examScore, 0);
  const averageExamScore = validGrades.length > 0 ? Number((totalExamScore / validGrades.length).toFixed(2)) : 0;
  
  console.log({averageExamScore, totalExamScore, validLength: validGrades.length});
}
m().finally(() => prisma.$disconnect());
