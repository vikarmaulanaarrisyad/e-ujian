import { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import fs from 'fs';

// ==========================================
// BACKUP EXPORT
// ==========================================

export const exportBackup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Fetch all tables in FK-safe order
    const [
      users,
      schoolProfiles,
      academicYears,
      subjects,
      gradeWeights,
      students,
      reportGrades,
      examGrades,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.schoolProfile.findMany(),
      prisma.academicYear.findMany(),
      prisma.subject.findMany(),
      prisma.gradeWeight.findMany(),
      prisma.student.findMany(),
      prisma.reportGrade.findMany(),
      prisma.examGrade.findMany(),
    ]);

    const backup = {
      metadata: {
        version: '1.0',
        createdAt: new Date().toISOString(),
        appName: 'SIPANMU - Sistem Pengolahan Nilai Ujian Madrasah',
        totalRecords: {
          users: users.length,
          schoolProfiles: schoolProfiles.length,
          academicYears: academicYears.length,
          subjects: subjects.length,
          gradeWeights: gradeWeights.length,
          students: students.length,
          reportGrades: reportGrades.length,
          examGrades: examGrades.length,
        },
      },
      data: {
        users,
        schoolProfiles,
        academicYears,
        subjects,
        gradeWeights,
        students,
        reportGrades,
        examGrades,
      },
    };

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
    const fileName = `backup_sipanmu_${timestamp}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).json(backup);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BACKUP RESTORE (IMPORT)
// ==========================================

export const importBackup = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No backup file uploaded.' });
  }

  const filePath = req.file.path;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    let backup: any;

    try {
      backup = JSON.parse(raw);
    } catch {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'File backup tidak valid. Pastikan file adalah JSON yang benar.' });
    }

    // Validate structure
    if (!backup?.metadata || !backup?.data) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Format file backup tidak dikenali. Pastikan menggunakan file backup dari SIPANMU.' });
    }

    const {
      users = [],
      schoolProfiles = [],
      academicYears = [],
      subjects = [],
      gradeWeights = [],
      students = [],
      reportGrades = [],
      examGrades = [],
    } = backup.data;

    // Run full restore inside a transaction
    await prisma.$transaction(
      async (tx) => {
        // 1. Delete in reverse FK order
        await tx.examGrade.deleteMany();
        await tx.reportGrade.deleteMany();
        await tx.gradeWeight.deleteMany();
        await tx.student.deleteMany();
        await tx.subject.deleteMany();
        await tx.academicYear.deleteMany();
        await tx.schoolProfile.deleteMany();
        await tx.user.deleteMany();

        // 2. Re-insert in FK-safe order
        if (users.length > 0) {
          await tx.user.createMany({ data: users.map(sanitizeUser) });
        }
        if (schoolProfiles.length > 0) {
          await tx.schoolProfile.createMany({ data: schoolProfiles.map(stripTimestamps) });
        }
        if (academicYears.length > 0) {
          await tx.academicYear.createMany({ data: academicYears.map(stripTimestamps) });
        }
        if (subjects.length > 0) {
          await tx.subject.createMany({ data: subjects.map(stripTimestamps) });
        }
        if (gradeWeights.length > 0) {
          await tx.gradeWeight.createMany({ data: gradeWeights.map(stripTimestamps) });
        }
        if (students.length > 0) {
          await tx.student.createMany({ data: students.map(sanitizeStudent) });
        }
        if (reportGrades.length > 0) {
          await tx.reportGrade.createMany({ data: reportGrades.map(stripTimestamps) });
        }
        if (examGrades.length > 0) {
          await tx.examGrade.createMany({ data: examGrades.map(stripTimestamps) });
        }
      },
      { timeout: 60000 }
    );

    fs.unlinkSync(filePath);

    return res.status(200).json({
      message: 'Database berhasil di-restore dari file backup.',
      restoredAt: new Date().toISOString(),
      backupCreatedAt: backup.metadata?.createdAt,
      restored: {
        users: users.length,
        schoolProfiles: schoolProfiles.length,
        academicYears: academicYears.length,
        subjects: subjects.length,
        gradeWeights: gradeWeights.length,
        students: students.length,
        reportGrades: reportGrades.length,
        examGrades: examGrades.length,
      },
    });
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    next(error);
  }
};

// ==========================================
// HELPERS
// ==========================================

/** Strip createdAt/updatedAt so Prisma uses defaults (avoids type mismatch) */
function stripTimestamps(record: any) {
  const { createdAt, updatedAt, ...rest } = record;
  return rest;
}

function sanitizeUser(record: any) {
  const { createdAt, updatedAt, ...rest } = record;
  return rest;
}

function sanitizeStudent(record: any) {
  const { createdAt, updatedAt, dateOfBirth, ...rest } = record;
  return {
    ...rest,
    // Restore dateOfBirth as a proper Date if present
    ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
  };
}
