import { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import { createSubjectSchema, updateSubjectSchema, reorderSubjectsSchema } from '../validators/subject.validator';

// Get all subjects
export const getAllSubjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: [
        { group: 'asc' },
        { order: 'asc' },
        { name: 'asc' },
      ],
    });
    return res.status(200).json(subjects);
  } catch (error) {
    next(error);
  }
};

// Get subject by ID
export const getSubjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const subject = await prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan' });
    }

    return res.status(200).json(subject);
  } catch (error) {
    next(error);
  }
};

// Create subject
export const createSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = createSubjectSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Validasi gagal',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { name, code, group, order } = validation.data;

    // Check code uniqueness
    const existingCode = await prisma.subject.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existingCode) {
      return res.status(400).json({ message: `Kode mata pelajaran '${code}' sudah terdaftar` });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        code: code.toUpperCase(),
        group,
        order,
      },
    });

    return res.status(201).json({
      message: 'Mata pelajaran berhasil ditambahkan',
      subject,
    });
  } catch (error) {
    next(error);
  }
};

// Update subject
export const updateSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validation = updateSubjectSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Validasi gagal',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const subject = await prisma.subject.findUnique({
      where: { id },
    });
    if (!subject) {
      return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan' });
    }

    const { name, code, group, order } = validation.data;

    if (code && code.toUpperCase() !== subject.code) {
      const existingCode = await prisma.subject.findUnique({
        where: { code: code.toUpperCase() },
      });
      if (existingCode) {
        return res.status(400).json({ message: `Kode mata pelajaran '${code}' sudah digunakan` });
      }
    }

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: {
        name,
        code: code ? code.toUpperCase() : undefined,
        group,
        order,
      },
    });

    return res.status(200).json({
      message: 'Mata pelajaran berhasil diubah',
      subject: updatedSubject,
    });
  } catch (error) {
    next(error);
  }
};

// Delete subject
export const deleteSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const subject = await prisma.subject.findUnique({
      where: { id },
    });
    if (!subject) {
      return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan' });
    }

    // Optional: Warn if subject has grades (Cascade delete is active, but check helps avoid accidental deletions)
    const reportGradeCount = await prisma.reportGrade.count({ where: { subjectId: id } });
    const examGradeCount = await prisma.examGrade.count({ where: { subjectId: id } });
    
    if (reportGradeCount > 0 || examGradeCount > 0) {
      // In this system, we can allow deletion but let's make it explicit or cascade
      // We'll let it execute, but we could also return 400. Let's allow deleting but warn or just let cascade delete happen.
      // Since onDelete: Cascade is in prisma schema, it will work. Let's proceed.
    }

    await prisma.subject.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Mata pelajaran berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// Bulk reorder subjects
export const reorderSubjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = reorderSubjectsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Validasi gagal',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { subjects } = validation.data;

    await prisma.$transaction(
      subjects.map((sub) =>
        prisma.subject.update({
          where: { id: sub.id },
          data: { order: sub.order },
        })
      )
    );

    return res.status(200).json({ message: 'Urutan mata pelajaran berhasil disimpan' });
  } catch (error) {
    next(error);
  }
};
