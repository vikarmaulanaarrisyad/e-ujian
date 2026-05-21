import { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import { SemesterType } from '@prisma/client';
import { logActivity } from '../lib/activityLog';

export const getAllAcademicYears = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const academicYears = await prisma.academicYear.findMany({
      include: {
        gradeWeights: true,
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'desc' },
      ],
    });
    return res.status(200).json(academicYears);
  } catch (error) {
    next(error);
  }
};

export const createAcademicYear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { year, semester } = req.body; // e.g., year: "2026/2027", semester: "ODD"

    const existing = await prisma.academicYear.findUnique({
      where: {
        year_semester: {
          year,
          semester: semester as SemesterType,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Tahun Ajaran dan Semester ini sudah ada.' });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        year,
        semester: semester as SemesterType,
        isActive: false, // by default not active until explicitly activated
        gradeWeights: {
          create: {
            reportPercentage: 60.0,
            examPercentage: 40.0,
          },
        },
      },
      include: {
        gradeWeights: true,
      },
    });

    logActivity({ req, action: 'CREATE_ACADEMIC_YEAR', entity: 'AcademicYear', entityId: academicYear.id, description: `Membuat tahun ajaran baru: ${year} - ${semester}` });

    return res.status(201).json({
      message: 'Tahun Ajaran berhasil dibuat.',
      data: academicYear,
    });
  } catch (error) {
    next(error);
  }
};

export const activateAcademicYear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if it exists
    const target = await prisma.academicYear.findUnique({ where: { id } });
    if (!target) {
      return res.status(404).json({ message: 'Tahun Ajaran tidak ditemukan.' });
    }

    // Transaction to ensure data consistency
    await prisma.$transaction([
      // Deactivate all
      prisma.academicYear.updateMany({
        data: { isActive: false },
      }),
      // Activate the selected one
      prisma.academicYear.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    logActivity({ req, action: 'ACTIVATE_ACADEMIC_YEAR', entity: 'AcademicYear', entityId: id, description: `Mengaktifkan tahun ajaran: ${target.year} - ${target.semester}` });

    return res.status(200).json({ message: 'Tahun Ajaran berhasil diaktifkan.' });
  } catch (error) {
    next(error);
  }
};

export const updateGradeWeight = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reportPercentage, examPercentage } = req.body;

    if (reportPercentage + examPercentage !== 100) {
      return res.status(400).json({ message: 'Total persentase bobot harus 100%.' });
    }

    const academicYear = await prisma.academicYear.findUnique({
      where: { id },
      include: { gradeWeights: true },
    });

    if (!academicYear) {
      return res.status(404).json({ message: 'Tahun Ajaran tidak ditemukan.' });
    }

    let gradeWeight;
    if (academicYear.gradeWeights.length > 0) {
      gradeWeight = await prisma.gradeWeight.update({
        where: { id: academicYear.gradeWeights[0].id },
        data: {
          reportPercentage: Number(reportPercentage),
          examPercentage: Number(examPercentage),
        },
      });
    } else {
      gradeWeight = await prisma.gradeWeight.create({
        data: {
          academicYearId: id,
          reportPercentage: Number(reportPercentage),
          examPercentage: Number(examPercentage),
        },
      });
    }

    logActivity({ req, action: 'UPDATE_GRADE_WEIGHT', entity: 'GradeWeight', entityId: id, description: `Memperbarui bobot nilai TP ${academicYear.year}: Rapor ${reportPercentage}%, Ujian ${examPercentage}%` });

    return res.status(200).json({
      message: 'Bobot kelulusan berhasil diperbarui.',
      data: gradeWeight,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAcademicYear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const academicYear = await prisma.academicYear.findUnique({
      where: { id },
      include: {
        reportGrades: { take: 1 },
        examGrades: { take: 1 },
      },
    });

    if (!academicYear) {
      return res.status(404).json({ message: 'Tahun Ajaran tidak ditemukan.' });
    }

    if (academicYear.isActive) {
      return res.status(400).json({ message: 'Tahun Ajaran yang sedang aktif tidak dapat dihapus.' });
    }

    if (academicYear.reportGrades.length > 0 || academicYear.examGrades.length > 0) {
      return res.status(400).json({ message: 'Tidak dapat menghapus Tahun Ajaran ini karena sudah memiliki data nilai siswa yang terkait.' });
    }

    await prisma.academicYear.delete({
      where: { id },
    });

    logActivity({ req, action: 'DELETE_ACADEMIC_YEAR', entity: 'AcademicYear', entityId: id, description: `Menghapus tahun ajaran: ${academicYear.year} - ${academicYear.semester}` });

    return res.status(200).json({ message: 'Tahun Ajaran berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};
