"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenant_controller_1 = require("../controllers/tenant.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const enums_1 = require("../types/enums");
const router = (0, express_1.Router)();
// Only SUPER_ADMIN can manage tenants
router.use(auth_middleware_1.authenticateJWT);
router.use((0, rbac_middleware_1.requireRoles)(enums_1.Role.SUPER_ADMIN));
router.get('/', tenant_controller_1.getTenants);
router.post('/', tenant_controller_1.createTenant);
router.delete('/:id', tenant_controller_1.deleteTenant);
router.put('/:id/reset-password', tenant_controller_1.resetTenantPassword);
exports.default = router;
