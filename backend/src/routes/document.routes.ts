import { Router } from 'express';
import { getStudentDocumentData, getAllGraduatedSklData } from '../controllers/document.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Apply auth middleware to all document routes
router.use(authenticateJWT);

// Document routes
router.get('/student/:id', requireRoles(Role.ADMIN, Role.STAFF), getStudentDocumentData);
router.get('/skl-batch', requireRoles(Role.ADMIN, Role.STAFF), getAllGraduatedSklData);

export default router;

