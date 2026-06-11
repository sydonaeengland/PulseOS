import app from './app.js';
import env from './config/env.js';
import { testConnection } from './config/db.js';

const start = async () => {
  await testConnection();
  app.listen(env.port, () => {
    console.log(`PulseOS API running on port ${env.port}`);
    console.log(`Environment: ${env.nodeEnv}`);
  });
};

start();
