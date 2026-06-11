import express from 'express';
import corsMiddleware from './config/cors.js';
import authRoutes from './routes/auth.routes.js';
import { AppError } from './utils/errors.js';
import { error } from './utils/response.js';

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'PulseOS API', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);

app.use((req, res) => {
  return error(res, 'Route not found', 404);
});

app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return error(res, err.message, err.statusCode);
  }
  console.error(err.stack);
  return error(res, 'Internal server error', 500);
});

export default app;
