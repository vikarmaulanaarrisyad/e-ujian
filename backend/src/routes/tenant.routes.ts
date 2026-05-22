import { Router } from 'express';
import { getTenants, createTenant, deleteTenant, resetTenantPassword } from '../controllers/tenant.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { Role } from '../types/enums';

const router = Router();

// Only SUPER_ADMIN can manage tenants
router.use(authenticateJWT);
router.use(requireRoles(Role.SUPER_ADMIN));

router.get('/', getTenants);
router.post('/', createTenant);
router.delete('/:id', deleteTenant);
router.put('/:id/reset-password', resetTenantPassword);

export default router;
