import { Router } from 'express';
import {
  getGradeWeight,
  updateGradeWeight,
  getReportGrades,
  saveReportGrades,
  exportReportGrades,
  importReportGrades,
  exportAllReportGrades,
  importAllReportGrades,
  getExamGrades,
  saveExamGrades,
  exportExamGrades,
  importExamGrades,
  exportAllExamGrades,
  importAllExamGrades,
  getGradeRecap,
  exportGradeRecap,
  getSubjects,
  getMissingGrades,
} from '../controllers/grade.controller';
import {
  getTkaGrades,
  saveTkaGrades,
  exportTkaGrades,
  importTkaGrades,
} from '../controllers/tka.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { upload } from '../middlewares/upload.middleware';
import { Role } from '../types/enums';

const router = Router();

// Apply auth to all grade routes
router.use(authenticateJWT);

// Subjects route
router.get('/subjects', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getSubjects);

// Weight Configuration
router.get('/weight', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getGradeWeight);
router.put('/weight', requireRoles(Role.ADMIN), updateGradeWeight);

// Report card grades Sem 7-11
router.get('/reports', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getReportGrades);
router.post('/reports', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), saveReportGrades);
router.get('/reports/export', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), exportReportGrades);
router.get('/reports/export-all', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), exportAllReportGrades);
router.post('/reports/import', requireRoles(Role.ADMIN, Role.STAFF), upload.single('file'), importReportGrades);
router.post('/reports/import-all', requireRoles(Role.ADMIN, Role.STAFF), upload.single('file'), importAllReportGrades);

// Exam grades
router.get('/exams', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getExamGrades);
router.post('/exams', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), saveExamGrades);
router.get('/exams/export', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), exportExamGrades);
router.get('/exams/export-all', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), exportAllExamGrades);
router.post('/exams/import', requireRoles(Role.ADMIN, Role.STAFF), upload.single('file'), importExamGrades);
router.post('/exams/import-all', requireRoles(Role.ADMIN, Role.STAFF), upload.single('file'), importAllExamGrades);

// TKA grades
router.get('/tka', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getTkaGrades);
router.post('/tka', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), saveTkaGrades);
router.get('/tka/export', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), exportTkaGrades);
router.post('/tka/import', requireRoles(Role.ADMIN, Role.STAFF), upload.single('file'), importTkaGrades);

// Final calculated grade recap
router.get('/recap', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getGradeRecap);
router.get('/recap/export', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), exportGradeRecap);

// Missing grades checker
router.get('/missing', requireRoles(Role.ADMIN, Role.GURU, Role.STAFF), getMissingGrades);

export default router;
