import * as Notification from '../models/notification.model.js';
import { success, error } from '../utils/response.js';

// GET /api/v1/notifications
export const list = async (req, res) => {
  try {
    const notifications = await Notification.listForUser(req.user.id);
    const unread = await Notification.unreadCount(req.user.id);
    return success(res, { notifications, unread });
  } catch (err) {
    console.error('notifications list error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// GET /api/v1/notifications/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const unread = await Notification.unreadCount(req.user.id);
    return success(res, { unread });
  } catch (err) {
    console.error('notifications unreadCount error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// PATCH /api/v1/notifications/:id/read
export const markRead = async (req, res) => {
  try {
    await Notification.markRead(req.params.id, req.user.id);
    return success(res, { ok: true });
  } catch (err) {
    console.error('notifications markRead error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// PATCH /api/v1/notifications/read-all
export const markAllRead = async (req, res) => {
  try {
    await Notification.markAllRead(req.user.id);
    return success(res, { ok: true });
  } catch (err) {
    console.error('notifications markAllRead error:', err);
    return error(res, 'Something went wrong', 500);
  }
};
