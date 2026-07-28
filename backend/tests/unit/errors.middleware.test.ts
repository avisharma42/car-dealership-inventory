import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { errorHandler, HttpError, notFoundHandler } from '../../src/middleware/errors';

const app = express();
app.get('/http-error', (_req, _res, next) => next(new HttpError(418, 'I am a teapot')));
app.get('/zod-error', (_req, _res, next) => {
  const result = z.object({ name: z.string() }).safeParse({});
  next(result.success ? null : result.error);
});
app.get('/boom', (_req, _res, next) => next(new Error('unexpected')));
app.use(notFoundHandler);
app.use(errorHandler);

describe('errorHandler', () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

  afterAll(() => consoleError.mockRestore());

  it('maps an HttpError to its status and message', async () => {
    const res = await request(app).get('/http-error');

    expect(res.status).toBe(418);
    expect(res.body).toEqual({ error: 'I am a teapot' });
  });

  it('maps a ZodError to 400', async () => {
    const res = await request(app).get('/zod-error');

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });

  it('hides unexpected errors behind a 500', async () => {
    const res = await request(app).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('returns 404 for an unmatched route', async () => {
    const res = await request(app).get('/nope');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});
