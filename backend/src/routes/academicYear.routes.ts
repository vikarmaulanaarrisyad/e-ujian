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
import { Role } from '../types/enums';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getAllAcademicYears);

// Only SUPER_ADMIN can manage academic years
router.post('/', requireRoles(Role.SUPER_ADMIN), createAcademicYear);
router.patch('/:id/activate', requireRoles(Role.SUPER_ADMIN), activateAcademicYear);
router.put('/:id/weights', requireRoles(Role.SUPER_ADMIN), updateGradeWeight);
router.delete('/:id', requireRoles(Role.SUPER_ADMIN), deleteAcademicYear);

export default router;
