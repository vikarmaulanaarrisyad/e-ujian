"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const backup_controller_1 = require("../controllers/backup.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const enums_1 = require("../types/enums");
const router = (0, express_1.Router)();
// All backup routes require authentication
router.use(auth_middleware_1.authenticateJWT);
// Export full database backup as JSON — SUPER_ADMIN only
router.get('/export', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN), backup_controller_1.exportBackup);
// Import/restore database from JSON backup — SUPER_ADMIN only
router.post('/import', (0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN), upload_middleware_1.uploadJson.single('file'), backup_controller_1.importBackup);
exports.default = router;
