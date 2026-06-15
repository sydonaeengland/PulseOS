import { Router } from 'express';
import requireAuth from '../middleware/auth.middleware.js';
import requireRole from '../middleware/role.middleware.js';
import {
  getQueue,
  processCheckout,
  getByVisit,
  getVisitDocuments,
} from '../controllers/checkout.controller.js';

const router = Router();

// GET /api/v1/checkout/queue  — list completed visits awaiting checkout
router.get(
  '/queue',
  requireAuth,
  requireRole('receptionist', 'admin'),
  getQueue
);

// POST /api/v1/checkout  — process a checkout for a completed visit
router.post(
  '/',
  requireAuth,
  requireRole('receptionist', 'admin'),
  processCheckout
);

// GET /api/v1/checkout/visit/:visitId  — fetch checkout (with line items) for a visit
router.get('/visit/:visitId', requireAuth, getByVisit);

// GET /api/v1/checkout/visit/:visitId/documents  — OTC, sick certs, investigations, imaging
router.get('/visit/:visitId/documents', requireAuth, requireRole('receptionist','admin'), getVisitDocuments);

export default router;
