import { Router } from 'express';
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  reorderSubjects,
} from '../controllers/subject.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Apply auth to all routes
router.use(authenticateJWT);

// Routes
router.get('/', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getAllSubjects);
router.get('/:id', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getSubjectById);
router.post('/', requireRoles(Role.ADMIN), createSubject);
router.put('/reorder', requireRoles(Role.ADMIN), reorderSubjects);
router.put('/:id', requireRoles(Role.ADMIN), updateSubject);
router.delete('/:id', requireRoles(Role.ADMIN), deleteSubject);

export default router;
