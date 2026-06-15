import { Router } from 'express';
import requireAuth from '../middleware/auth.middleware.js';
import requireRole from '../middleware/role.middleware.js';
import {
  listAppointments,
  listByPatient,
  getAppointment,
  bookAppointment,
  checkinAppointment,
  undoCheckin,
  cancelAppointment,
  noShowAppointment,
  getTodayStats,
  rescheduleAppointment,
  getDoctorView,
  getDoctorViewWeek,
  triageAppointment,
  triageComplete,
} from '../controllers/appointment.controller.js';

const router = Router();

router.get('/', requireAuth, requireRole('receptionist', 'admin', 'doctor', 'nurse'), listAppointments);

// Named static routes MUST come before /:id
router.get('/today/stats',       requireAuth, getTodayStats);
router.get('/patient/:patientId', requireAuth, listByPatient);
router.get('/doctor-view',       requireAuth, requireRole('receptionist', 'admin', 'doctor', 'nurse'), getDoctorView);
router.get('/doctor-view/week',  requireAuth, requireRole('receptionist', 'admin', 'doctor', 'nurse'), getDoctorViewWeek);

router.patch('/:id/checkin',        requireAuth, requireRole('receptionist', 'admin'), checkinAppointment);
router.patch('/:id/undo-checkin',   requireAuth, requireRole('receptionist', 'admin'), undoCheckin);
router.patch('/:id/cancel',         requireAuth, requireRole('receptionist', 'admin'), cancelAppointment);
router.patch('/:id/no-show',        requireAuth, requireRole('receptionist', 'admin'), noShowAppointment);
router.patch('/:id/reschedule',     requireAuth, requireRole('receptionist', 'admin'), rescheduleAppointment);
router.patch('/:id/triage',         requireAuth, requireRole('receptionist', 'admin', 'nurse'), triageAppointment);
router.patch('/:id/triage-complete',requireAuth, requireRole('receptionist', 'admin', 'nurse'), triageComplete);

router.get('/:id',  requireAuth, requireRole('receptionist', 'admin', 'doctor', 'nurse'), getAppointment);
router.post('/',    requireAuth, requireRole('receptionist', 'admin'), bookAppointment);

export default router;
