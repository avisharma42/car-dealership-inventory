import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import { env } from '../config/env';
import { User, Vehicle } from '../models';

const VEHICLES = [
  { make: 'Toyota', model: 'Corolla', category: 'sedan', price: 24999, quantity: 6 },
  { make: 'Toyota', model: 'RAV4', category: 'suv', price: 32999, quantity: 3 },
  { make: 'Ford', model: 'F-150', category: 'truck', price: 45999, quantity: 2 },
  { make: 'Honda', model: 'Civic', category: 'sedan', price: 22999, quantity: 0 },
  { make: 'Volkswagen', model: 'Golf', category: 'hatchback', price: 27499, quantity: 4 },
  { make: 'Chrysler', model: 'Pacifica', category: 'van', price: 38999, quantity: 1 },
] as const;

const seed = async (): Promise<void> => {
  const passwordHash = await bcrypt.hash('password123', env.bcryptSaltRounds);

  await User.findOrCreate({
    where: { email: 'admin@dealership.test' },
    defaults: { name: 'Dealership Admin', email: 'admin@dealership.test', passwordHash, role: 'admin' },
  });
  await User.findOrCreate({
    where: { email: 'buyer@dealership.test' },
    defaults: { name: 'Sam Buyer', email: 'buyer@dealership.test', passwordHash, role: 'user' },
  });

  for (const vehicle of VEHICLES) {
    await Vehicle.findOrCreate({ where: { make: vehicle.make, model: vehicle.model }, defaults: vehicle });
  }

  /* eslint-disable-next-line no-console */
  console.log('Seeded admin@dealership.test / buyer@dealership.test (password: password123)');
  await sequelize.close();
};

seed().catch((err) => {
  /* eslint-disable-next-line no-console */
  console.error(err);
  process.exit(1);
});
