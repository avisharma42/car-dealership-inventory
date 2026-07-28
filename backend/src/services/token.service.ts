import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../models';

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn } as SignOptions);

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.jwt.secret);
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new Error('Malformed token payload');
  }
  return { sub: decoded.sub, role: decoded.role as UserRole };
};
