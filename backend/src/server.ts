import { createApp } from './app';
import { sequelize } from './config/database';
import { env } from './config/env';
import './models';

const start = async (): Promise<void> => {
  await sequelize.authenticate();
  const app = createApp();
  app.listen(env.port, () => {
    /* eslint-disable-next-line no-console */
    console.log(`API listening on http://localhost:${env.port}`);
  });
};

start().catch((err) => {
  /* eslint-disable-next-line no-console */
  console.error('Failed to start server', err);
  process.exit(1);
});
