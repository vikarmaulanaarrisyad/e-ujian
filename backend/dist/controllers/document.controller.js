"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllGraduatedSknrData = exports.getBatchTkaStatementData = exports.getStudentSknrData = exports.getAllGraduatedSklData = exports.getStudentDocumentData = void 0;
const db_1 = __importDefault(require("../db"));
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
    signatureUrl: null,
    sklNumberFormat: null,
    accreditation: 'A',
    createdAt: new Date(),
    updatedAt: new Date(),
});
// Helper: make logoUrl and signatureUrl absolute
const resolveUrls = (profile, req) => {
    const host = req.get('host');
    const protocol = req.protocol;
    if (profile.logoUrl && !profile.logoUrl.startsWith('http')) {
        profile.logoUrl = `${protocol}://${host}${profile.logoUrl}`;
    }
    if (profile.signatureUrl && !profile.signatureUrl.startsWith('http')) {
        profile.signatureUrl = `${protocol}://${host}${profile.signatureUrl}`;
    }
    return profile;
};
const getStudentDocumentData = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;
        // Fetch active academic year and grade weights
        const activeYear = await db_1.default.academicYear.findFirst({
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
        let profile = await db_1.default.schoolProfile.findUnique({ where: { tenantId }, include: { tenant: true } }) || defaultProfile();
        profile = resolveUrls({ ...profile }, req);
        // Fetch student with all their grades
        const student = await db_1.default.student.findUnique({
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
        const subjects = await db_1.default.subject.findMany({
            where: { tenantId },
            orderBy: [{ group: 'asc' }, { order: 'asc' }, { name: 'asc' }],
        });
        const activeSemestersStr = weight.activeSemesters || "7,8,9,10,11";
        const activeSemesters = activeSemestersStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        // Group report grades by subject (only if semester is in activeSemesters)
        const reportGradesBySubject = {};
        student.reportGrades.forEach((rg) => {
            if (activeSemesters.includes(rg.semester)) {
                if (!reportGradesBySubject[rg.subjectId]) {
                    reportGradesBySubject[rg.subjectId] = [];
                }
                reportGradesBySubject[rg.subjectId].push(rg.score);
            }
        });
        // Group exam grades by subject
        const examGradesBySubject = {};
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
        let totalExamScore = 0;
        if (grades.length > 0) {
            totalFinalScore = grades.reduce((acc, curr) => acc + curr.finalScore, 0);
            totalExamScore = grades.reduce((acc, curr) => acc + curr.examScore, 0);
        }
        const averageFinalScore = grades.length > 0 ? Number((totalFinalScore / grades.length).toFixed(2)) : 0;
        const averageExamScore = grades.length > 0 ? Number((totalExamScore / grades.length).toFixed(2)) : 0;
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
                photoUrl: student.photoUrl,
            },
            schoolProfile: profile,
            grades,
            averageFinalScore,
            averageExamScore,
            academicYear: activeYear.year,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentDocumentData = getStudentDocumentData;
// Get all graduated students data for batch SKL printing
const getAllGraduatedSklData = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        // Fetch active academic year
        const activeYear = await db_1.default.academicYear.findFirst({
            where: { isActive: true, tenantId },
            include: { gradeWeights: true },
        });
        if (!activeYear) {
            return res.status(404).json({ message: 'Tidak ada tahun ajaran aktif.' });
        }
        // Fetch school profile
        let profile = await db_1.default.schoolProfile.findUnique({ where: { tenantId }, include: { tenant: true } }) || defaultProfile();
        profile = resolveUrls({ ...profile }, req);
        // Fetch all graduated students ordered by sklNumber then name
        const students = await db_1.default.student.findMany({
            where: { isGraduated: true, tenantId },
            include: {
                examGrades: {
                    where: { academicYearId: activeYear.id },
                }
            },
            orderBy: [{ sklNumber: 'asc' }, { name: 'asc' }],
        });
        if (students.length === 0) {
            return res.status(404).json({ message: 'Tidak ada siswa yang berstatus lulus.' });
        }
        // Fetch all subjects to build the transcript table
        const subjects = await db_1.default.subject.findMany({
            where: { tenantId },
            orderBy: [{ group: 'asc' }, { order: 'asc' }, { name: 'asc' }],
        });
        return res.status(200).json({
            students: students.map((s) => {
                // Map exam scores for this student
                const examGradesBySubject = {};
                s.examGrades.forEach((eg) => {
                    examGradesBySubject[eg.subjectId] = eg.score;
                });
                const grades = subjects.map((subject) => ({
                    subjectId: subject.id,
                    subjectName: subject.name,
                    subjectGroup: subject.group,
                    examScore: Number((examGradesBySubject[subject.id] || 0).toFixed(2)),
                }));
                const validGrades = grades.filter(g => g.examScore > 0);
                const totalExamScore = validGrades.reduce((acc, curr) => acc + curr.examScore, 0);
                const averageExamScore = validGrades.length > 0 ? Number((totalExamScore / validGrades.length).toFixed(2)) : 0;
                return {
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
                    photoUrl: s.photoUrl,
                    grades,
                    averageExamScore,
                };
            }),
            schoolProfile: profile,
            academicYear: activeYear.year,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllGraduatedSklData = getAllGraduatedSklData;
const getStudentSknrData = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { semesters, format, gabungArab } = req.query;
        const tenantId = req.user.tenantId;
        let activeSemesters = [7, 8, 9, 10, 11];
        if (typeof semesters === 'string' && semesters.trim() !== '') {
            activeSemesters = semesters.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        }
        const activeYear = await db_1.default.academicYear.findFirst({
            where: { isActive: true, tenantId },
            include: { gradeWeights: true },
        });
        if (!activeYear) {
            return res.status(404).json({ message: 'Tidak ada tahun ajaran aktif.' });
        }
        let profile = await db_1.default.schoolProfile.findUnique({ where: { tenantId }, include: { tenant: true } }) || defaultProfile();
        profile = resolveUrls({ ...profile }, req);
        const student = await db_1.default.student.findUnique({
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
        const { subjects, totalAverage } = processSknrGrades(student.reportGrades, activeSemesters, typeof format === 'string' ? format : undefined, gabungArab === 'true');
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
                sknrNumber: student.sknrNumber,
                photoUrl: student.photoUrl,
            },
            schoolProfile: profile,
            sknrDetails: {
                activeSemesters,
                subjects,
                totalAverage,
            },
            academicYear: activeYear.year,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentSknrData = getStudentSknrData;
const getBatchTkaStatementData = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const activeYear = await db_1.default.academicYear.findFirst({
            where: { isActive: true, tenantId },
            include: { gradeWeights: true },
        });
        if (!activeYear) {
            return res.status(404).json({ message: 'Tidak ada tahun ajaran aktif.' });
        }
        let profile = await db_1.default.schoolProfile.findUnique({ where: { tenantId }, include: { tenant: true } }) || defaultProfile();
        profile = resolveUrls({ ...profile }, req);
        const students = await db_1.default.student.findMany({
            where: { tenantId, isGraduated: true },
            include: {
                tkaGrades: {
                    where: { academicYearId: activeYear.id },
                }
            },
            orderBy: { name: 'asc' },
        });
        if (students.length === 0) {
            return res.status(404).json({ message: 'Tidak ada siswa lulus.' });
        }
        return res.status(200).json({
            students: students.map((s) => {
                let mathScore = 0;
                let indoScore = 0;
                s.tkaGrades.forEach((grade) => {
                    if (grade.subjectType === 'MATEMATIKA')
                        mathScore = grade.score;
                    if (grade.subjectType === 'BAHASA_INDONESIA')
                        indoScore = grade.score;
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
    }
    catch (error) {
        next(error);
    }
};
exports.getBatchTkaStatementData = getBatchTkaStatementData;
// Helper function to process SKNR grades
const processSknrGrades = (reportGrades, activeSemesters, format, gabungArab = false) => {
    const validReportGrades = reportGrades.filter(rg => activeSemesters.includes(rg.semester));
    const subjectsMap = new Map();
    validReportGrades.forEach(rg => {
        const lowerName = rg.subject.name.toLowerCase();
        const isAgama = lowerName.includes('quran') || lowerName.includes('qur\'an') || lowerName.includes('qur`an') || lowerName.includes('hadis') || lowerName.includes('hadits') ||
            lowerName.includes('akidah') || lowerName.includes('aqidah') ||
            lowerName.includes('fikih') || lowerName.includes('fiqih') ||
            lowerName.includes('sejarah kebudayaan islam') || lowerName === 'ski' ||
            lowerName.includes('agama') ||
            (gabungArab && lowerName.includes('arab'));
        let mapKey = isAgama ? 'agama_group' : rg.subject.id;
        let mapName = isAgama ? 'Pendidikan Agama dan Budi Pekerti' : rg.subject.name;
        let mapOrder = isAgama ? -1 : (rg.subject.order || 0); // -1 to force it to top
        if (format === '7mapel') {
            let matched = false;
            if (isAgama) {
                mapName = 'Pendidikan Agama dan Budi Pekerti';
                mapKey = '7m_agama';
                mapOrder = 1;
                matched = true;
            }
            else if (lowerName.includes('pancasila') || lowerName.includes('ppkn') || lowerName.includes('kewarganegaraan')) {
                mapName = 'Pendidikan Pancasila';
                mapKey = '7m_pancasila';
                mapOrder = 2;
                matched = true;
            }
            else if (lowerName.includes('indonesia')) {
                mapName = 'Bahasa Indonesia';
                mapKey = '7m_indonesia';
                mapOrder = 3;
                matched = true;
            }
            else if (lowerName.includes('matematika')) {
                mapName = 'Matematika';
                mapKey = '7m_mtk';
                mapOrder = 4;
                matched = true;
            }
            else if (lowerName.includes('ilmu pengetahuan alam') || lowerName.includes('ipas') || lowerName === 'ipa' || lowerName.includes('ipa ') || lowerName === 'ips' || lowerName.includes('ips ') || lowerName.includes('sosial')) {
                mapName = 'Ilmu Pengetahuan Alam dan Sosial';
                mapKey = '7m_ipas';
                mapOrder = 5;
                matched = true;
            }
            else if (lowerName.includes('jasmani') || lowerName.includes('olahraga') || lowerName.includes('pjok') || lowerName.includes('penjas')) {
                mapName = 'Pendidikan Jasmani, Olahraga dan Kesehatan';
                mapKey = '7m_pjok';
                mapOrder = 6;
                matched = true;
            }
            else if (lowerName.includes('seni') || lowerName.includes('sbdp') || lowerName.includes('prakarya')) {
                mapName = 'Seni dan Budaya';
                mapKey = '7m_seni';
                mapOrder = 7;
                matched = true;
            }
            if (!matched)
                return;
        }
        if (!subjectsMap.has(mapKey)) {
            subjectsMap.set(mapKey, {
                subjectId: mapKey,
                subjectName: mapName,
                order: mapOrder,
                semesterScores: {},
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
        const finalScores = {};
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
        if (a.order !== b.order)
            return a.order - b.order;
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
const getAllGraduatedSknrData = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const { semesters, format, gabungArab } = req.query;
        let activeSemesters = [7, 8, 9, 10, 11];
        if (typeof semesters === 'string' && semesters.trim() !== '') {
            activeSemesters = semesters.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        }
        const activeYear = await db_1.default.academicYear.findFirst({
            where: { isActive: true, tenantId },
            include: { gradeWeights: true },
        });
        if (!activeYear) {
            return res.status(404).json({ message: 'Tidak ada tahun ajaran aktif.' });
        }
        let profile = await db_1.default.schoolProfile.findUnique({ where: { tenantId }, include: { tenant: true } }) || defaultProfile();
        profile = resolveUrls({ ...profile }, req);
        const students = await db_1.default.student.findMany({
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
                const { subjects, totalAverage } = processSknrGrades(student.reportGrades, activeSemesters, typeof format === 'string' ? format : undefined, gabungArab === 'true');
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
    }
    catch (error) {
        next(error);
    }
};
exports.getAllGraduatedSknrData = getAllGraduatedSknrData;
