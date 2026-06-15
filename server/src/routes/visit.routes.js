import { Router } from 'express';
import requireAuth from '../middleware/auth.middleware.js';
import requireRole from '../middleware/role.middleware.js';
import * as Visit from '../models/visit.model.js';

import { success, error } from '../utils/response.js';

const router = Router();

// GET /api/v1/visits/patient/:patientId — recent visits for autofill
router.get(
  '/patient/:patientId',
  requireAuth,
  requireRole('receptionist', 'admin', 'doctor', 'nurse'),
  async (req, res) => {
    try {
      const visits = await Visit.getByPatientId(req.params.patientId);
      return success(res, { visits });
    } catch (err) {
      console.error('getPatientVisits error:', err);
      return error(res, 'Something went wrong', 500);
    }
  }
);

// GET /api/v1/visits/patient/:patientId/prescriptions
router.get(
  '/patient/:patientId/prescriptions',
  requireAuth,
  requireRole('receptionist', 'admin', 'doctor', 'nurse'),
  async (req, res) => {
    try {
      const prescriptions = await Visit.getPrescriptionsByPatientId(req.params.patientId);
      return success(res, { prescriptions });
    } catch (err) {
      console.error('getPatientPrescriptions error:', err);
      return error(res, 'Something went wrong', 500);
    }
  }
);

export default router;
