import { Router } from 'express';
import { login, refresh, logout } from '../controllers/auth.controller.js';
import requireAuth from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', requireAuth, logout);

export default router;
