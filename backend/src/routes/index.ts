import { Router } from 'express';
import authRouter from './auth.routes';
import studentRouter from './student.routes';
import gradeRouter from './grade.routes';
import subjectRouter from './subject.routes';
import backupRouter from './backup.routes';
import documentRouter from './document.routes';
import schoolRouter from './school.routes';
import academicYearRouter from './academicYear.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/students', studentRouter);
router.use('/grades', gradeRouter);
router.use('/subjects', subjectRouter);
router.use('/backup', backupRouter);
router.use('/documents', documentRouter);
router.use('/school', schoolRouter);
router.use('/academic-years', academicYearRouter);

export default router;
