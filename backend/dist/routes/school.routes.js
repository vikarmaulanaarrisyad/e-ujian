"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const school_controller_1 = require("../controllers/school.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Apply auth middleware to all school routes
router.use(auth_middleware_1.authenticateJWT);
router.get('/', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.GURU, client_1.Role.STAFF), school_controller_1.getSchoolProfile);
// Only ADMIN can update school profile
router.put('/', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN), upload_middleware_1.uploadImage.single('logo'), school_controller_1.updateSchoolProfile);
exports.default = router;
