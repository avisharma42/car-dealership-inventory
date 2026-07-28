/* Config consumed by sequelize-cli for migrations. Mirrors src/config/env.ts. */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const base = {
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'dealership',
  password: process.env.DB_PASSWORD || 'dealership',
  logging: false,
};

module.exports = {
  development: { ...base, database: process.env.DB_NAME || 'car_dealership_dev' },
  test: { ...base, database: process.env.TEST_DB_NAME || 'car_dealership_test' },
  production: { ...base, database: process.env.DB_NAME || 'car_dealership' },
};
