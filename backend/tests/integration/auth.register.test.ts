import request from 'supertest';
import { createApp } from '../../src/app';
import { User } from '../../src/models';

const app = createApp();

describe('POST /api/auth/register', () => {
  const validPayload = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'sup3rsecret',
  };

  it('creates a user and returns 201 with a JWT and the sanitized user', async () => {
    const res = await request(app).post('/api/auth/register').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      name: validPayload.name,
      email: validPayload.email,
      role: 'user',
    });
    expect(res.body.user.id).toEqual(expect.any(String));
  });

  it('never returns the password or its hash', async () => {
    const res = await request(app).post('/api/auth/register').send(validPayload);

    expect(JSON.stringify(res.body)).not.toContain(validPayload.password);
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('stores a bcrypt hash rather than the plaintext password', async () => {
    await request(app).post('/api/auth/register').send(validPayload);

    const stored = await User.findOne({ where: { email: validPayload.email } });
    expect(stored).not.toBeNull();
    expect(stored?.passwordHash).not.toBe(validPayload.password);
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(validPayload);
    const res = await request(app).post('/api/auth/register').send(validPayload);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Email already registered' });
  });

  it.each([
    ['missing name', { email: 'a@b.com', password: 'sup3rsecret' }],
    ['invalid email', { name: 'A', email: 'not-an-email', password: 'sup3rsecret' }],
    ['short password', { name: 'A', email: 'a@b.com', password: 'short' }],
  ])('returns 400 for %s', async (_label, payload) => {
    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });
});
