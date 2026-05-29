"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_1 = require("../controllers/student.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const enums_1 = require("../types/enums");
const router = (0, express_1.Router)();
// Apply auth middleware to all student routes
router.use(auth_middleware_1.authenticateJWT);
// Excel template, import and export routes
router.get('/template', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.STAFF), student_controller_1.getStudentTemplate);
router.get('/export', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), student_controller_1.exportStudents);
router.post('/import', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.STAFF), upload_middleware_1.upload.single('file'), student_controller_1.importStudents);
router.post('/upload-photos', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.STAFF), upload_middleware_1.uploadZip.single('file'), student_controller_1.uploadPhotos);
router.post('/archive', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN), student_controller_1.archiveStudents);
// Standard CRUD routes
router.get('/', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), student_controller_1.getAllStudents);
router.get('/:id', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), student_controller_1.getStudentById);
router.post('/', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.STAFF), student_controller_1.createStudent);
router.put('/:id', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.STAFF), student_controller_1.updateStudent);
router.delete('/:id', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN), student_controller_1.deleteStudent);
// Graduation routes
router.patch('/:id/graduation', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.STAFF), student_controller_1.updateGraduationStatus);
router.post('/graduation/batch', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.STAFF), student_controller_1.batchUpdateGraduation);
router.post('/graduation/assign-skl-numbers', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.STAFF), student_controller_1.batchAssignSklNumbers);
router.post('/graduation/assign-sknr-numbers', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.STAFF), student_controller_1.batchAssignSknrNumbers);
exports.default = router;
