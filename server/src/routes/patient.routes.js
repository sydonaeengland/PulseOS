import { Router } from 'express';
import requireAuth from '../middleware/auth.middleware.js';
import requireRole from '../middleware/role.middleware.js';
import {
  listPatients,
  registerPatient,
  getPatient,
  searchPatients,
  getPendingPatients,
  activatePatient,
  updatePatient,
} from '../controllers/patient.controller.js';

const router = Router();

// Static paths must come before /:id
router.get('/', requireAuth, listPatients);
router.get('/search', requireAuth, searchPatients);
router.get('/pending', requireAuth, requireRole('receptionist', 'admin'), getPendingPatients);

router.post('/', requireAuth, requireRole('receptionist', 'admin'), registerPatient);
router.get('/:id', requireAuth, getPatient);
router.patch('/:id/activate', requireAuth, requireRole('receptionist', 'admin'), activatePatient);
router.patch('/:id', requireAuth, requireRole('receptionist', 'admin', 'doctor', 'nurse'), updatePatient);

export default router;
