"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const grade_controller_1 = require("../controllers/grade.controller");
const tka_controller_1 = require("../controllers/tka.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const enums_1 = require("../types/enums");
const router = (0, express_1.Router)();
// Apply auth to all grade routes
router.use(auth_middleware_1.authenticateJWT);
// Subjects route
router.get('/subjects', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), grade_controller_1.getSubjects);
// Weight Configuration
router.get('/weight', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), grade_controller_1.getGradeWeight);
router.put('/weight', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN), grade_controller_1.updateGradeWeight);
// Report card grades Sem 7-11
router.get('/reports', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), grade_controller_1.getReportGrades);
router.post('/reports', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), grade_controller_1.saveReportGrades);
router.get('/reports/export', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), grade_controller_1.exportReportGrades);
router.get('/reports/export-all', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), grade_controller_1.exportAllReportGrades);
router.post('/reports/import', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.STAFF), upload_middleware_1.upload.single('file'), grade_controller_1.importReportGrades);
router.post('/reports/import-all', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.STAFF), upload_middleware_1.upload.single('file'), grade_controller_1.importAllReportGrades);
// Exam grades
router.get('/exams', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), grade_controller_1.getExamGrades);
router.post('/exams', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), grade_controller_1.saveExamGrades);
router.get('/exams/export', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), grade_controller_1.exportExamGrades);
router.get('/exams/export-all', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), grade_controller_1.exportAllExamGrades);
router.post('/exams/import', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.STAFF), upload_middleware_1.upload.single('file'), grade_controller_1.importExamGrades);
router.post('/exams/import-all', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.STAFF), upload_middleware_1.upload.single('file'), grade_controller_1.importAllExamGrades);
// TKA grades
router.get('/tka', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), tka_controller_1.getTkaGrades);
router.post('/tka', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), tka_controller_1.saveTkaGrades);
router.get('/tka/export', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), tka_controller_1.exportTkaGrades);
router.post('/tka/import', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.STAFF), upload_middleware_1.upload.single('file'), tka_controller_1.importTkaGrades);
// Final calculated grade recap
router.get('/recap', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), grade_controller_1.getGradeRecap);
router.get('/recap/export', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), grade_controller_1.exportGradeRecap);
// Missing grades checker
router.get('/missing', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), grade_controller_1.getMissingGrades);
exports.default = router;
