import { Router } from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentTemplate,
  exportStudents,
  importStudents,
} from '../controllers/student.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { upload } from '../middlewares/upload.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Apply auth middleware to all student routes
router.use(authenticateJWT);

// Excel template, import and export routes
router.get('/template', requireRoles(Role.ADMIN, Role.STAFF), getStudentTemplate);
router.get('/export', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), exportStudents);
router.post('/import', requireRoles(Role.ADMIN, Role.STAFF), upload.single('file'), importStudents);

// Standard CRUD routes
router.get('/', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getAllStudents);
router.get('/:id', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getStudentById);
router.post('/', requireRoles(Role.ADMIN, Role.STAFF), createStudent);
router.put('/:id', requireRoles(Role.ADMIN, Role.STAFF), updateStudent);
router.delete('/:id', requireRoles(Role.ADMIN), deleteStudent);

export default router;
