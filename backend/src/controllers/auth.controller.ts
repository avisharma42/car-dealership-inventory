import { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.service';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(await authService.register(req.body));
  } catch (err) {
    next(err);
  }
};
