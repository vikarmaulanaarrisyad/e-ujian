"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subject_controller_1 = require("../controllers/subject.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const enums_1 = require("../types/enums");
const router = (0, express_1.Router)();
// Apply auth to all routes
router.use(auth_middleware_1.authenticateJWT);
// Excel template, import and export routes
router.get('/template', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN, enums_1.Role.ADMIN), subject_controller_1.getSubjectTemplate);
router.post('/generate-default', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN, enums_1.Role.ADMIN), subject_controller_1.generateDefaultSubjects);
router.post('/import', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN, enums_1.Role.ADMIN), upload_middleware_1.upload.single('file'), subject_controller_1.importSubjects);
// Routes
router.get('/', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN, enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), subject_controller_1.getAllSubjects);
router.get('/:id', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN, enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), subject_controller_1.getSubjectById);
router.post('/', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN, enums_1.Role.ADMIN), subject_controller_1.createSubject);
router.put('/reorder', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN, enums_1.Role.ADMIN), subject_controller_1.reorderSubjects);
router.put('/:id', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN, enums_1.Role.ADMIN), subject_controller_1.updateSubject);
router.delete('/:id', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN, enums_1.Role.ADMIN), subject_controller_1.deleteSubject);
exports.default = router;
