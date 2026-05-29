"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sync_controller_1 = require("../controllers/sync.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const enums_1 = require("../types/enums");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
// Only Super Admin or Admin can trigger sync
router.post('/mysql', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN, enums_1.Role.ADMIN), sync_controller_1.syncDatabase);
exports.default = router;
