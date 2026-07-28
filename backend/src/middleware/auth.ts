import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../models';
import { verifyToken } from '../services/token.service';
import { HttpError } from './errors';

declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace Express {
    interface Request {
      user?: { id: string; role: UserRole };
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    next(new HttpError(401, 'Authentication required'));
    return;
  }

  try {
    const { sub, role } = verifyToken(token);
    req.user = { id: sub, role };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    next(new HttpError(403, 'Admin privileges required'));
    return;
  }
  next();
};
