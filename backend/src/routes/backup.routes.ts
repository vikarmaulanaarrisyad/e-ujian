import { Router } from 'express';
import { exportBackup, importBackup } from '../controllers/backup.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { uploadJson } from '../middlewares/upload.middleware';
import { Role } from '../types/enums';

const router = Router();

// All backup routes require authentication
router.use(authenticateJWT);

// Export full database backup as JSON — SUPER_ADMIN only
router.get('/export', requireRoles(Role.SUPER_ADMIN), exportBackup);

// Import/restore database from JSON backup — SUPER_ADMIN only
router.post('/import', requireRoles(Role.SUPER_ADMIN), uploadJson.single('file'), importBackup);

export default router;
