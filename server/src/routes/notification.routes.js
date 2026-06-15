import { Router } from 'express';
import requireAuth from '../middleware/auth.middleware.js';
import { list, getUnreadCount, markRead, markAllRead } from '../controllers/notification.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/',             list);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all',   markAllRead);
router.patch('/:id/read',   markRead);

export default router;
