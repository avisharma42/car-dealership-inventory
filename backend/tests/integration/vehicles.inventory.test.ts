import request from 'supertest';
import { createApp } from '../../src/app';
import { Vehicle } from '../../src/models';
import { createUserWithToken } from '../helpers/auth';

const app = createApp();

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

const seedVehicle = (quantity: number) =>
  Vehicle.create({
    make: 'Toyota',
    model: 'Corolla',
    category: 'sedan',
    price: 24000,
    quantity,
  } as never);

describe('POST /api/vehicles/:id/purchase', () => {
  it('returns 401 without a token', async () => {
    const vehicle = await seedVehicle(1);

    expect((await request(app).post(`/api/vehicles/${vehicle.id}/purchase`)).status).toBe(401);
  });

  it('decrements quantity by 1 by default', async () => {
    const { authHeader } = await createUserWithToken();
    const vehicle = await seedVehicle(3);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(2);
    await expect(vehicle.reload().then((v) => v.quantity)).resolves.toBe(2);
  });

  it('decrements by the requested qty', async () => {
    const { authHeader } = await createUserWithToken();
    const vehicle = await seedVehicle(5);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', authHeader)
      .send({ qty: 3 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(2);
  });

  it('returns 409 when stock is insufficient', async () => {
    const { authHeader } = await createUserWithToken();
    const vehicle = await seedVehicle(1);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', authHeader)
      .send({ qty: 2 });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Insufficient stock' });
    await expect(vehicle.reload().then((v) => v.quantity)).resolves.toBe(1);
  });

  it('returns 409 when the vehicle is out of stock', async () => {
    const { authHeader } = await createUserWithToken();
    const vehicle = await seedVehicle(0);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(409);
  });

  it('returns 404 for an unknown vehicle', async () => {
    const { authHeader } = await createUserWithToken();

    const res = await request(app)
      .post(`/api/vehicles/${UNKNOWN_ID}/purchase`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Vehicle not found' });
  });

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['fractional', 1.5],
  ])('returns 400 for a %s qty', async (_label, qty) => {
    const { authHeader } = await createUserWithToken();
    const vehicle = await seedVehicle(5);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', authHeader)
      .send({ qty });

    expect(res.status).toBe(400);
  });

  it('never lets quantity go below zero under concurrent purchases', async () => {
    const { authHeader } = await createUserWithToken();
    const stock = 5;
    const vehicle = await seedVehicle(stock);

    const attempts = 20;
    const responses = await Promise.all(
      Array.from({ length: attempts }, () =>
        request(app).post(`/api/vehicles/${vehicle.id}/purchase`).set('Authorization', authHeader),
      ),
    );

    const succeeded = responses.filter((res) => res.status === 200).length;
    const conflicted = responses.filter((res) => res.status === 409).length;

    expect(succeeded).toBe(stock);
    expect(conflicted).toBe(attempts - stock);
    await expect(vehicle.reload().then((v) => v.quantity)).resolves.toBe(0);
  });
});

describe('POST /api/vehicles/:id/restock', () => {
  it('returns 403 for a non-admin', async () => {
    const { authHeader } = await createUserWithToken('user');
    const vehicle = await seedVehicle(1);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', authHeader)
      .send({ qty: 5 });

    expect(res.status).toBe(403);
    await expect(vehicle.reload().then((v) => v.quantity)).resolves.toBe(1);
  });

  it('increments quantity for an admin', async () => {
    const { authHeader } = await createUserWithToken('admin');
    const vehicle = await seedVehicle(2);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', authHeader)
      .send({ qty: 8 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(10);
  });

  it('defaults the increment to 1', async () => {
    const { authHeader } = await createUserWithToken('admin');
    const vehicle = await seedVehicle(2);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', authHeader);

    expect(res.body.quantity).toBe(3);
  });

  it('returns 404 for an unknown vehicle', async () => {
    const { authHeader } = await createUserWithToken('admin');

    const res = await request(app)
      .post(`/api/vehicles/${UNKNOWN_ID}/restock`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(404);
  });

  it('returns 400 for a non-positive qty', async () => {
    const { authHeader } = await createUserWithToken('admin');
    const vehicle = await seedVehicle(2);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', authHeader)
      .send({ qty: 0 });

    expect(res.status).toBe(400);
  });
});
