import { Router } from 'express';
import requireAuth from '../middleware/auth.middleware.js';
import requireRole from '../middleware/role.middleware.js';
import { getPaginated } from '../controllers/audit.controller.js';

const router = Router();

// GET /api/v1/audit?page=1  — paginated audit log, admin only
router.get('/', requireAuth, requireRole('admin'), getPaginated);

export default router;
