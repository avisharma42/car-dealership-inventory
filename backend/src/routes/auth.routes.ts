import { Router } from 'express';
import { z } from 'zod';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';

const registerSchema = z.object({
  name: z.string().trim().min(1, 'is required'),
  email: z.string().trim().email('must be a valid email address'),
  password: z.string().min(8, 'must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().trim().email('must be a valid email address'),
  password: z.string().min(1, 'is required'),
});

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), authController.register);
authRouter.post('/login', validate(loginSchema), authController.login);
