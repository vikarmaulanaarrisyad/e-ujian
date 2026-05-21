import { z } from 'zod';

export const updateGradeWeightSchema = z.object({
  reportPercentage: z.number().min(0).max(100, 'Report percentage must be between 0 and 100'),
  examPercentage: z.number().min(0).max(100, 'Exam percentage must be between 0 and 100'),
  activeSemesters: z.array(z.string()).optional(),
}).refine(data => data.reportPercentage + data.examPercentage === 100, {
  message: 'Total percentage must equal 100%',
  path: ['examPercentage'],
});

export const reportGradeItemSchema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  semester: z.number().int().min(7).max(12, 'Semester must be between 7 and 12'),
  score: z.number().min(0).max(100, 'Score must be between 0 and 100'),
});

export const saveReportGradesSchema = z.object({
  grades: z.array(reportGradeItemSchema),
});

export const examGradeItemSchema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  score: z.number().min(0).max(100, 'Score must be between 0 and 100'),
});

export const saveExamGradesSchema = z.object({
  grades: z.array(examGradeItemSchema),
});
