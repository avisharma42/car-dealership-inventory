import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

const credentials = {
  name: 'Grace Hopper',
  email: 'grace@example.com',
  password: 'sup3rsecret',
};

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(credentials);
  });

  it('returns 200 with a JWT for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: credentials.email, role: 'user' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('is case-insensitive on the email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'GRACE@EXAMPLE.COM', password: credentials.password });

    expect(res.status).toBe(200);
  });

  it('returns 401 for a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid credentials' });
  });

  it('returns the same 401 for an unknown email (no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: credentials.password });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid credentials' });
  });

  it('returns 400 when the email is malformed', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nope', password: 'x' });

    expect(res.status).toBe(400);
  });
});
