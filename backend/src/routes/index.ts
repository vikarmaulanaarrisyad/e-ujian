import { Router } from 'express';
import authRouter from './auth.routes';
import studentRouter from './student.routes';
import gradeRouter from './grade.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/students', studentRouter);
router.use('/grades', gradeRouter);

export default router;
