import { sequelize } from '../src/config/database';
import '../src/models';

beforeAll(async () => {
  // The test database is rebuilt from the models; dev/prod use sequelize-cli migrations.
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true });
});

afterAll(async () => {
  await sequelize.close();
});
