import { Router } from 'express';
import requireAuth from '../middleware/auth.middleware.js';
import requireRole from '../middleware/role.middleware.js';
import {
  getSettings,
  updateSettings,
  updateFee,
} from '../controllers/settings.controller.js';

const router = Router();

// GET /api/v1/settings  — all roles can read settings
router.get('/', requireAuth, getSettings);

// PATCH /api/v1/settings  — admin only: update facility info
router.patch('/', requireAuth, requireRole('admin'), updateSettings);

// PATCH /api/v1/settings/fees/:visitType  — admin only: update a single fee
// Must come before a potential /:id wildcard if any is added later
router.patch('/fees/:visitType', requireAuth, requireRole('admin'), updateFee);

export default router;
