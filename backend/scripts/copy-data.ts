import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Copying data...');
  const sourceTenantId = '4cbebca9-c233-43ad-9d5b-860dab240424'; // MI Bustanul Huda
  
  // Get destination tenants
  const destTenants = await prisma.tenant.findMany({
    where: { slug: { in: ['mi-01', 'mi-02'] } }
  });

  for (const dest of destTenants) {
    console.log(`Copying to ${dest.name}...`);
    
    // 1. Copy Academic Year
    const sourceYears = await prisma.academicYear.findMany({ where: { tenantId: sourceTenantId } });
    for (const sy of sourceYears) {
      const existYear = await prisma.academicYear.findUnique({ where: { tenantId_year_semester: { tenantId: dest.id, year: sy.year, semester: sy.semester } } });
      let newYearId = existYear?.id;
      if (!existYear) {
        const ny = await prisma.academicYear.create({
          data: {
            tenantId: dest.id,
            year: sy.year,
            semester: sy.semester,
            isActive: sy.isActive
          }
        });
        newYearId = ny.id;
        console.log(`Created year ${ny.year}`);
      }

      // Copy Grade Weights
      const sourceWeights = await prisma.gradeWeight.findMany({ where: { academicYearId: sy.id } });
      for (const sw of sourceWeights) {
        await prisma.gradeWeight.create({
          data: {
            tenantId: dest.id,
            academicYearId: newYearId!,
            reportPercentage: sw.reportPercentage,
            examPercentage: sw.examPercentage,
            activeSemesters: sw.activeSemesters
          }
        });
      }
    }

    // 2. Copy Subjects
    const sourceSubjects = await prisma.subject.findMany({ where: { tenantId: sourceTenantId } });
    const subjectMap = new Map(); // sourceId -> destId
    for (const ss of sourceSubjects) {
      const existSubject = await prisma.subject.findUnique({ where: { tenantId_code: { tenantId: dest.id, code: ss.code } } });
      if (existSubject) {
        subjectMap.set(ss.id, existSubject.id);
      } else {
        const ns = await prisma.subject.create({
          data: {
            tenantId: dest.id,
            name: ss.name,
            code: ss.code,
            group: ss.group,
            order: ss.order
          }
        });
        subjectMap.set(ss.id, ns.id);
      }
    }

    // 3. Copy Students
    const sourceStudents = await prisma.student.findMany({ where: { tenantId: sourceTenantId } });
    const studentMap = new Map();
    for (const st of sourceStudents) {
      const existStudent = await prisma.student.findUnique({ where: { tenantId_nis: { tenantId: dest.id, nis: st.nis } } });
      if (existStudent) {
        studentMap.set(st.id, existStudent.id);
      } else {
        const nst = await prisma.student.create({
          data: {
            tenantId: dest.id,
            nis: st.nis,
            nisn: st.nisn,
            name: st.name,
            gender: st.gender,
            class: st.class,
            placeOfBirth: st.placeOfBirth,
            dateOfBirth: st.dateOfBirth,
            parentName: st.parentName,
            isGraduated: st.isGraduated,
            graduationDate: st.graduationDate,
            certificateNumber: st.certificateNumber,
            sklNumber: st.sklNumber,
            isAlumni: st.isAlumni,
            alumniYear: st.alumniYear
          }
        });
        studentMap.set(st.id, nst.id);
      }
    }

    // 4. Copy Report Grades
    const sourceReportGrades = await prisma.reportGrade.findMany({ where: { tenantId: sourceTenantId } });
    console.log(`Copying ${sourceReportGrades.length} report grades...`);
    let copiedRG = 0;
    for (const rg of sourceReportGrades) {
      const destStudentId = studentMap.get(rg.studentId);
      const destSubjectId = subjectMap.get(rg.subjectId);
      // find active year in dest that matches source year
      const sourceYear = sourceYears.find(y => y.id === rg.academicYearId);
      if (!sourceYear) continue;
      const destYear = await prisma.academicYear.findUnique({ where: { tenantId_year_semester: { tenantId: dest.id, year: sourceYear.year, semester: sourceYear.semester } } });
      if (!destStudentId || !destSubjectId || !destYear) continue;

      try {
        await prisma.reportGrade.upsert({
          where: { tenantId_studentId_subjectId_academicYearId_semester: { tenantId: dest.id, studentId: destStudentId, subjectId: destSubjectId, academicYearId: destYear.id, semester: rg.semester } },
          update: { score: rg.score },
          create: {
            tenantId: dest.id,
            studentId: destStudentId,
            subjectId: destSubjectId,
            academicYearId: destYear.id,
            semester: rg.semester,
            score: rg.score
          }
        });
        copiedRG++;
      } catch (e) { }
    }
    console.log(`Copied ${copiedRG} report grades.`);

    // 5. Copy Exam Grades
    const sourceExamGrades = await prisma.examGrade.findMany({ where: { tenantId: sourceTenantId } });
    console.log(`Copying ${sourceExamGrades.length} exam grades...`);
    let copiedEG = 0;
    for (const eg of sourceExamGrades) {
      const destStudentId = studentMap.get(eg.studentId);
      const destSubjectId = subjectMap.get(eg.subjectId);
      const sourceYear = sourceYears.find(y => y.id === eg.academicYearId);
      if (!sourceYear) continue;
      const destYear = await prisma.academicYear.findUnique({ where: { tenantId_year_semester: { tenantId: dest.id, year: sourceYear.year, semester: sourceYear.semester } } });
      if (!destStudentId || !destSubjectId || !destYear) continue;

      try {
        await prisma.examGrade.upsert({
          where: { tenantId_studentId_subjectId_academicYearId: { tenantId: dest.id, studentId: destStudentId, subjectId: destSubjectId, academicYearId: destYear.id } },
          update: { score: eg.score },
          create: {
            tenantId: dest.id,
            studentId: destStudentId,
            subjectId: destSubjectId,
            academicYearId: destYear.id,
            score: eg.score
          }
        });
        copiedEG++;
      } catch (e) {}
    }
    console.log(`Copied ${copiedEG} exam grades.`);
  }

  console.log('Done!');
}

main();
