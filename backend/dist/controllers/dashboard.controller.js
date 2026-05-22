"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const db_1 = __importDefault(require("../db"));
const getDashboardStats = async (req, res, next) => {
    try {
        const activeYear = await db_1.default.academicYear.findFirst({
            where: { isActive: true }
        });
        // 1. Total Students
        const totalStudents = await db_1.default.student.count();
        // 2. Gender distribution
        const maleStudents = await db_1.default.student.count({ where: { gender: 'L' } });
        const femaleStudents = await db_1.default.student.count({ where: { gender: 'P' } });
        // 3. Graduation Status
        const graduatedStudents = await db_1.default.student.count({ where: { isGraduated: true } });
        const notGraduatedStudents = await db_1.default.student.count({ where: { isGraduated: false } });
        // 4. Grades averages (if active year exists)
        let avgReport = 0;
        let avgExam = 0;
        if (activeYear) {
            const reportAgg = await db_1.default.reportGrade.aggregate({
                where: { academicYearId: activeYear.id },
                _avg: { score: true }
            });
            avgReport = reportAgg._avg.score || 0;
            const examAgg = await db_1.default.examGrade.aggregate({
                where: { academicYearId: activeYear.id },
                _avg: { score: true }
            });
            avgExam = examAgg._avg.score || 0;
        }
        // Calculate pass rate
        const passRate = totalStudents > 0 ? (graduatedStudents / totalStudents) * 100 : 0;
        return res.status(200).json({
            activeAcademicYear: activeYear ? {
                year: activeYear.year,
                semester: activeYear.semester
            } : null,
            students: {
                total: totalStudents,
                male: maleStudents,
                female: femaleStudents,
            },
            graduation: {
                graduated: graduatedStudents,
                notGraduated: notGraduatedStudents,
                passRate: passRate,
            },
            averages: {
                report: Number(avgReport.toFixed(2)),
                exam: Number(avgExam.toFixed(2)),
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
