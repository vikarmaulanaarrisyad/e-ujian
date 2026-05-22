import { Router } from 'express';
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  reorderSubjects,
  getSubjectTemplate,
  importSubjects,
  generateDefaultSubjects
} from '../controllers/subject.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { upload } from '../middlewares/upload.middleware';
import { Role } from '../types/enums';

const router = Router();

// Apply auth to all routes
router.use(authenticateJWT);

// Excel template, import and export routes
router.get('/template', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), getSubjectTemplate);
router.post('/generate-default', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), generateDefaultSubjects);

router.post('/import', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), upload.single('file'), importSubjects);

// Routes
router.get('/', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.GURU, Role.STAFF), getAllSubjects);
router.get('/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.GURU, Role.STAFF), getSubjectById);
router.post('/', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), createSubject);
router.put('/reorder', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), reorderSubjects);
router.put('/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), updateSubject);
router.delete('/:id', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), deleteSubject);

export default router;
