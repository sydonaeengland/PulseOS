import express from 'express';
import corsMiddleware from './config/cors.js';
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import registerRoutes from './routes/register.routes.js';
import staffRoutes from './routes/staff.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import auditRoutes from './routes/audit.routes.js';
import visitRoutes from './routes/visit.routes.js';
import scheduleRoutes from './routes/schedule.routes.js';
import notificationRoutes from './routes/notification.routes.js';
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
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/register', registerRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/visits', visitRoutes);
app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.use((_req, res) => {
  return error(res, 'Route not found', 404);
});

app.use((err, _req, res, _next) => {
  if (err instanceof AppError) {
    return error(res, err.message, err.statusCode);
  }
  console.error(err.stack);
  return error(res, 'Internal server error', 500);
});

export default app;
