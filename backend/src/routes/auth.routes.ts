import { Router } from 'express';
import { login, getMe, switchTenant } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateJWT, getMe);
router.post('/switch-tenant', authenticateJWT, switchTenant);

export default router;
