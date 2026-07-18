import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { createError, asyncHandler } from '../middleware/error-handler.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    throw createError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
  }

  const { email, password, name } = validation.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw createError(409, 'Email already registered', 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  const token = generateToken({ userId: user.id, email: user.email });

  res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    throw createError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
  }

  const { email, password } = validation.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw createError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw createError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const token = generateToken({ userId: user.id, email: user.email });

  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  });
}));

export { router as authRoutes };
