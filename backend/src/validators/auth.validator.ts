import { z } from 'zod';
import { Role } from '@prisma/client';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Invalid role. Must be ADMIN, GURU, or STAFF' }) }),
});

export const updateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  role: z.nativeEnum(Role).optional(),
});
