import { Router } from 'express';
import {
  getActivityLogs,
  getActivityLogsMeta,
  clearOldLogs,
} from '../controllers/activityLog.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { Role } from '../types/enums';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRoles(Role.ADMIN), getActivityLogs);
router.get('/meta', requireRoles(Role.ADMIN), getActivityLogsMeta);
router.delete('/old', requireRoles(Role.ADMIN), clearOldLogs);

export default router;
