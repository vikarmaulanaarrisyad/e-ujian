import { Router } from 'express';
import authRouter from './auth.routes';
import studentRouter from './student.routes';
import gradeRouter from './grade.routes';
import subjectRouter from './subject.routes';
import backupRouter from './backup.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/students', studentRouter);
router.use('/grades', gradeRouter);
router.use('/subjects', subjectRouter);
router.use('/backup', backupRouter);

export default router;
