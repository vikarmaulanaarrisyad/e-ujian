"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subject_controller_1 = require("../controllers/subject.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Apply auth to all routes
router.use(auth_middleware_1.authenticateJWT);
// Routes
router.get('/', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.GURU, client_1.Role.STAFF), subject_controller_1.getAllSubjects);
router.get('/:id', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.GURU, client_1.Role.STAFF), subject_controller_1.getSubjectById);
router.post('/', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN), subject_controller_1.createSubject);
router.put('/reorder', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN), subject_controller_1.reorderSubjects);
router.put('/:id', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN), subject_controller_1.updateSubject);
router.delete('/:id', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN), subject_controller_1.deleteSubject);
exports.default = router;
