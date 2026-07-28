import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { HttpError } from './errors';

type RequestPart = 'body' | 'query' | 'params';

/** Parses and replaces a request part with the schema's validated output. */
export const validate =
  (schema: ZodSchema, part: RequestPart = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue.path.join('.');
      next(new HttpError(400, field ? `${field}: ${issue.message}` : issue.message));
      return;
    }
    Object.defineProperty(req, part, { value: result.data, writable: true, configurable: true });
    next();
  };
