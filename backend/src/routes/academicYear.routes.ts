import { Router } from 'express';
import {
  getAllAcademicYears,
  createAcademicYear,
  activateAcademicYear,
  updateGradeWeight,
  deleteAcademicYear,
} from '../controllers/academicYear.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getAllAcademicYears);

// Only ADMIN can manage academic years
router.post('/', requireRoles(Role.ADMIN), createAcademicYear);
router.patch('/:id/activate', requireRoles(Role.ADMIN), activateAcademicYear);
router.put('/:id/weights', requireRoles(Role.ADMIN), updateGradeWeight);
router.delete('/:id', requireRoles(Role.ADMIN), deleteAcademicYear);

export default router;
