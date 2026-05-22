"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveExamGradesSchema = exports.examGradeItemSchema = exports.saveReportGradesSchema = exports.reportGradeItemSchema = exports.updateGradeWeightSchema = void 0;
const zod_1 = require("zod");
exports.updateGradeWeightSchema = zod_1.z.object({
    reportPercentage: zod_1.z.number().min(0).max(100, 'Report percentage must be between 0 and 100'),
    examPercentage: zod_1.z.number().min(0).max(100, 'Exam percentage must be between 0 and 100'),
    activeSemesters: zod_1.z.array(zod_1.z.string()).optional(),
}).refine(data => data.reportPercentage + data.examPercentage === 100, {
    message: 'Total percentage must equal 100%',
    path: ['examPercentage'],
});
exports.reportGradeItemSchema = zod_1.z.object({
    studentId: zod_1.z.string(),
    subjectId: zod_1.z.string(),
    semester: zod_1.z.number().int().min(7).max(12, 'Semester must be between 7 and 12'),
    score: zod_1.z.number().min(0).max(100, 'Score must be between 0 and 100'),
});
exports.saveReportGradesSchema = zod_1.z.object({
    grades: zod_1.z.array(exports.reportGradeItemSchema),
});
exports.examGradeItemSchema = zod_1.z.object({
    studentId: zod_1.z.string(),
    subjectId: zod_1.z.string(),
    score: zod_1.z.number().min(0).max(100, 'Score must be between 0 and 100'),
});
exports.saveExamGradesSchema = zod_1.z.object({
    grades: zod_1.z.array(exports.examGradeItemSchema),
});
