import { Router } from 'express';
import { getSchoolProfile, updateSchoolProfile } from '../controllers/school.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { uploadImage } from '../middlewares/upload.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Apply auth middleware to all school routes
router.use(authenticateJWT);

router.get('/', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getSchoolProfile);
// Only ADMIN can update school profile
router.put('/', requireRoles(Role.ADMIN), uploadImage.single('logo'), updateSchoolProfile);

export default router;
