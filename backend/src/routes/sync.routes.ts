import { Router } from 'express';
import { syncDatabase } from '../controllers/sync.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { Role } from '../types/enums';

const router = Router();

router.use(authenticateJWT);

// Only Super Admin or Admin can trigger sync
router.post('/mysql', requireRoles(Role.SUPER_ADMIN, Role.ADMIN), syncDatabase);

export default router;
