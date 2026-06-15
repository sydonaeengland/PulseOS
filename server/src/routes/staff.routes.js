import { Router } from 'express';
import requireAuth from '../middleware/auth.middleware.js';
import requireRole from '../middleware/role.middleware.js';
import {
  listStaff,
  listDoctors,
  createStaff,
  deactivateStaff,
} from '../controllers/staff.controller.js';

const router = Router();

// GET /api/v1/staff?role=doctor  — list all active staff, optional role filter
router.get('/', requireAuth, requireRole('receptionist', 'admin', 'doctor', 'nurse'), listStaff);

// GET /api/v1/staff/doctors  — shorthand: only doctors, for booking dropdown
// Must come before /:id
router.get('/doctors', requireAuth, requireRole('receptionist', 'admin', 'doctor', 'nurse'), listDoctors);

// POST /api/v1/staff  — admin only: create a new staff user
router.post('/', requireAuth, requireRole('admin'), createStaff);

// PATCH /api/v1/staff/:id/deactivate  — admin only: soft-delete a staff member
router.patch('/:id/deactivate', requireAuth, requireRole('admin'), deactivateStaff);

export default router;
