import { z } from 'zod';
import { SubjectGroup } from '@prisma/client';

export const createSubjectSchema = z.object({
  name: z.string().min(2, 'Nama mata pelajaran minimal 2 karakter'),
  code: z.string().min(2, 'Kode mata pelajaran minimal 2 karakter'),
  group: z.nativeEnum(SubjectGroup, { errorMap: () => ({ message: 'Kelompok mata pelajaran tidak valid' }) }),
  order: z.number().int().nonnegative().default(0),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const reorderSubjectsSchema = z.object({
  subjects: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().nonnegative(),
    })
  ),
});
