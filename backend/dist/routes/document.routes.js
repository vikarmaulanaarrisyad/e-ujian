"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const document_controller_1 = require("../controllers/document.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Apply auth middleware to all document routes
router.use(auth_middleware_1.authenticateJWT);
// Document routes
router.get('/student/:id', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.STAFF), document_controller_1.getStudentDocumentData);
router.get('/skl-batch', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.STAFF), document_controller_1.getAllGraduatedSklData);
exports.default = router;
