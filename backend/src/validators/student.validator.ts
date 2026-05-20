import { z } from 'zod';
import { Gender } from '@prisma/client';

export const createStudentSchema = z.object({
  nis: z.string().min(3, 'NIS must be at least 3 characters'),
  nisn: z.string().length(10, 'NISN must be exactly 10 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  gender: z.nativeEnum(Gender, { errorMap: () => ({ message: 'Gender must be L (Laki-laki) or P (Perempuan)' }) }),
  class: z.string().default('6'),
  placeOfBirth: z.string().optional(),
  dateOfBirth: z.preprocess((arg) => {
    if (typeof arg === 'string' && arg) return new Date(arg);
    return arg;
  }, z.date().optional()),
  parentName: z.string().optional(),
});

export const updateStudentSchema = createStudentSchema.partial();
