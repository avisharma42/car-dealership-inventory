import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { env } from '../../src/config/env';
import { requireAdmin, requireAuth } from '../../src/middleware/auth';
import { errorHandler } from '../../src/middleware/errors';
import { signToken } from '../../src/services/token.service';

const buildApp = () => {
  const app = express();
  app.get('/protected', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });
  app.get('/admin', requireAuth, requireAdmin, (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
};

const app = buildApp();
const bearer = (token: string) => `Bearer ${token}`;

describe('requireAuth', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
  });

  it('returns 401 when the Authorization header is not a Bearer token', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Basic abc123');

    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app).get('/protected').set('Authorization', bearer('not-a-jwt'));

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid or expired token' });
  });

  it('returns 401 for a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ sub: 'abc', role: 'admin' }, 'someone-elses-secret');
    const res = await request(app).get('/protected').set('Authorization', bearer(forged));

    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired token', async () => {
    const expired = jwt.sign({ sub: 'abc', role: 'user' }, env.jwt.secret, { expiresIn: '-1s' });
    const res = await request(app).get('/protected').set('Authorization', bearer(expired));

    expect(res.status).toBe(401);
  });

  it('attaches id and role to req.user for a valid token', async () => {
    const token = signToken({ sub: 'user-123', role: 'user' });
    const res = await request(app).get('/protected').set('Authorization', bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 'user-123', role: 'user' });
  });
});

describe('requireAdmin', () => {
  it('returns 403 for an authenticated non-admin', async () => {
    const token = signToken({ sub: 'user-123', role: 'user' });
    const res = await request(app).get('/admin').set('Authorization', bearer(token));

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin privileges required' });
  });

  it('allows an admin through', async () => {
    const token = signToken({ sub: 'admin-1', role: 'admin' });
    const res = await request(app).get('/admin').set('Authorization', bearer(token));

    expect(res.status).toBe(200);
  });
});
