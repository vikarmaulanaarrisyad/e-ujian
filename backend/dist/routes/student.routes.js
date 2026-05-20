"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_1 = require("../controllers/student.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Apply auth middleware to all student routes
router.use(auth_middleware_1.authenticateJWT);
// Excel template, import and export routes
router.get('/template', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.STAFF), student_controller_1.getStudentTemplate);
router.get('/export', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.GURU, client_1.Role.STAFF), student_controller_1.exportStudents);
router.post('/import', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.STAFF), upload_middleware_1.upload.single('file'), student_controller_1.importStudents);
// Standard CRUD routes
router.get('/', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.GURU, client_1.Role.STAFF), student_controller_1.getAllStudents);
router.get('/:id', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.GURU, client_1.Role.STAFF), student_controller_1.getStudentById);
router.post('/', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.STAFF), student_controller_1.createStudent);
router.put('/:id', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.STAFF), student_controller_1.updateStudent);
router.delete('/:id', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN), student_controller_1.deleteStudent);
exports.default = router;
