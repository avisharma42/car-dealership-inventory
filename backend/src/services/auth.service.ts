import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { HttpError } from '../middleware/errors';
import { User } from '../models';
import { signToken } from './token.service';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: ReturnType<User['toJSON']>;
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const issue = (user: User): AuthResult => ({
  token: signToken({ sub: user.id, role: user.role }),
  user: user.toJSON(),
});

export const register = async ({ name, email, password }: RegisterInput): Promise<AuthResult> => {
  const normalizedEmail = normalizeEmail(email);

  if (await User.findOne({ where: { email: normalizedEmail } })) {
    throw new HttpError(409, 'Email already registered');
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, env.bcryptSaltRounds),
  });

  return issue(user);
};
