import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { Role } from '../types/enums';

const router = Router();

router.use(authenticateJWT);

router.get('/stats', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getDashboardStats);

export default router;
