"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Protect all routes
router.use(auth_middleware_1.authenticateJWT);
// Only ADMIN can manage users
router.use((0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN));
router.get('/', user_controller_1.getUsers);
router.post('/', user_controller_1.createUser);
router.put('/:id', user_controller_1.updateUser);
router.delete('/:id', user_controller_1.deleteUser);
exports.default = router;
