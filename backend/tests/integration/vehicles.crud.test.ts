import request from 'supertest';
import { createApp } from '../../src/app';
import { Vehicle } from '../../src/models';
import { createUserWithToken } from '../helpers/auth';

const app = createApp();

const validVehicle = {
  make: 'Toyota',
  model: 'Corolla',
  category: 'sedan',
  price: 24999.99,
  quantity: 5,
};

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

describe('POST /api/vehicles', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/vehicles').send(validVehicle);

    expect(res.status).toBe(401);
  });

  it('creates a vehicle and returns 201 for an authenticated user', async () => {
    const { authHeader } = await createUserWithToken();

    const res = await request(app).post('/api/vehicles').set('Authorization', authHeader).send(validVehicle);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(validVehicle);
    expect(res.body.id).toEqual(expect.any(String));
    await expect(Vehicle.count()).resolves.toBe(1);
  });

  it('defaults quantity to 0 when omitted', async () => {
    const { authHeader } = await createUserWithToken();
    const { quantity: _quantity, ...withoutQuantity } = validVehicle;

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', authHeader)
      .send(withoutQuantity);

    expect(res.status).toBe(201);
    expect(res.body.quantity).toBe(0);
  });

  it.each([
    ['missing make', { ...validVehicle, make: undefined }],
    ['unknown category', { ...validVehicle, category: 'spaceship' }],
    ['negative price', { ...validVehicle, price: -1 }],
    ['negative quantity', { ...validVehicle, quantity: -3 }],
  ])('returns 400 for %s', async (_label, payload) => {
    const { authHeader } = await createUserWithToken();

    const res = await request(app).post('/api/vehicles').set('Authorization', authHeader).send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });
});

describe('GET /api/vehicles', () => {
  it('returns 401 without a token', async () => {
    expect((await request(app).get('/api/vehicles')).status).toBe(401);
  });

  it('lists all vehicles for an authenticated user', async () => {
    const { authHeader } = await createUserWithToken();
    await Vehicle.bulkCreate([
      validVehicle as never,
      { make: 'Ford', model: 'F-150', category: 'truck', price: 45000, quantity: 2 } as never,
    ]);

    const res = await request(app).get('/api/vehicles').set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].price).toEqual(expect.any(Number));
  });
});

describe('PUT /api/vehicles/:id', () => {
  it('updates vehicle details for an authenticated user', async () => {
    const { authHeader } = await createUserWithToken();
    const vehicle = await Vehicle.create(validVehicle as never);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', authHeader)
      .send({ price: 19999, quantity: 9 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ price: 19999, quantity: 9, model: 'Corolla' });
  });

  it('returns 404 for an unknown id', async () => {
    const { authHeader } = await createUserWithToken();

    const res = await request(app)
      .put(`/api/vehicles/${UNKNOWN_ID}`)
      .set('Authorization', authHeader)
      .send({ price: 100 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Vehicle not found' });
  });

  it('returns 400 for an invalid field value', async () => {
    const { authHeader } = await createUserWithToken();
    const vehicle = await Vehicle.create(validVehicle as never);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', authHeader)
      .send({ price: -5 });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/vehicles/:id', () => {
  it('returns 403 for a non-admin', async () => {
    const { authHeader } = await createUserWithToken('user');
    const vehicle = await Vehicle.create(validVehicle as never);

    const res = await request(app).delete(`/api/vehicles/${vehicle.id}`).set('Authorization', authHeader);

    expect(res.status).toBe(403);
    await expect(Vehicle.count()).resolves.toBe(1);
  });

  it('deletes the vehicle for an admin and returns 204', async () => {
    const { authHeader } = await createUserWithToken('admin');
    const vehicle = await Vehicle.create(validVehicle as never);

    const res = await request(app).delete(`/api/vehicles/${vehicle.id}`).set('Authorization', authHeader);

    expect(res.status).toBe(204);
    await expect(Vehicle.count()).resolves.toBe(0);
  });

  it('returns 404 when the vehicle does not exist', async () => {
    const { authHeader } = await createUserWithToken('admin');

    const res = await request(app).delete(`/api/vehicles/${UNKNOWN_ID}`).set('Authorization', authHeader);

    expect(res.status).toBe(404);
  });
});
