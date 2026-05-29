"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academicYear_controller_1 = require("../controllers/academicYear.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const enums_1 = require("../types/enums");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
router.get('/', (0, rbac_middleware_1.requireRoles)(enums_1.Role.ADMIN, enums_1.Role.GURU, enums_1.Role.STAFF), academicYear_controller_1.getAllAcademicYears);
// Only SUPER_ADMIN can manage academic years
router.post('/', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN), academicYear_controller_1.createAcademicYear);
router.patch('/:id/activate', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN), academicYear_controller_1.activateAcademicYear);
router.put('/:id/weights', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN), academicYear_controller_1.updateGradeWeight);
router.delete('/:id', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN), academicYear_controller_1.deleteAcademicYear);
exports.default = router;
