import request from 'supertest';
import { createApp } from '../../src/app';
import { Vehicle } from '../../src/models';
import { createUserWithToken } from '../helpers/auth';

const app = createApp();

const seed = () =>
  Vehicle.bulkCreate([
    { make: 'Toyota', model: 'Corolla', category: 'sedan', price: 24000, quantity: 3 },
    { make: 'Toyota', model: 'RAV4', category: 'suv', price: 32000, quantity: 1 },
    { make: 'Ford', model: 'F-150', category: 'truck', price: 45000, quantity: 4 },
    { make: 'Honda', model: 'Civic', category: 'sedan', price: 22000, quantity: 0 },
  ] as never[]);

const search = async (query: Record<string, string | number>) => {
  const { authHeader } = await createUserWithToken();
  return request(app).get('/api/vehicles/search').query(query).set('Authorization', authHeader);
};

describe('GET /api/vehicles/search', () => {
  beforeEach(seed);

  it('returns 401 without a token', async () => {
    expect((await request(app).get('/api/vehicles/search')).status).toBe(401);
  });

  it('filters by make, case-insensitively and partially', async () => {
    const res = await search({ make: 'toyo' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((v: { make: string }) => v.make === 'Toyota')).toBe(true);
  });

  it('filters by model', async () => {
    const res = await search({ model: 'civic' });

    expect(res.body).toHaveLength(1);
    expect(res.body[0].model).toBe('Civic');
  });

  it('filters by category', async () => {
    const res = await search({ category: 'sedan' });

    expect(res.body).toHaveLength(2);
  });

  it('filters by minPrice', async () => {
    const res = await search({ minPrice: 30000 });

    expect(res.body.map((v: { model: string }) => v.model).sort()).toEqual(['F-150', 'RAV4']);
  });

  it('filters by maxPrice', async () => {
    const res = await search({ maxPrice: 24000 });

    expect(res.body.map((v: { model: string }) => v.model).sort()).toEqual(['Civic', 'Corolla']);
  });

  it('combines filters', async () => {
    const res = await search({ make: 'Toyota', category: 'suv', minPrice: 30000, maxPrice: 40000 });

    expect(res.body).toHaveLength(1);
    expect(res.body[0].model).toBe('RAV4');
  });

  it('returns every vehicle when no filters are supplied', async () => {
    const res = await search({});

    expect(res.body).toHaveLength(4);
  });

  it('returns an empty array when nothing matches', async () => {
    const res = await search({ make: 'Tesla' });

    expect(res.body).toEqual([]);
  });

  it('returns 400 for a non-numeric price filter', async () => {
    const res = await search({ minPrice: 'cheap' });

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });

  it('returns 400 for an unknown category', async () => {
    const res = await search({ category: 'spaceship' });

    expect(res.status).toBe(400);
  });
});
