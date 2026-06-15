import pool from '../config/db.js';

export async function create({ user_id, type, title, body = null, entity_type = null, entity_id = null }) {
  const [result] = await pool.execute(
    `INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user_id, type, title, body, entity_type, entity_id]
  );
  return result.insertId;
}

export async function listForUser(user_id, limit = 50) {
  const [rows] = await pool.execute(
    `SELECT id, type, title, body, entity_type, entity_id, is_read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [user_id, limit]
  );
  return rows;
}

export async function unreadCount(user_id) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0',
    [user_id]
  );
  return rows[0].cnt;
}

export async function markRead(id, user_id) {
  const [result] = await pool.execute(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [id, user_id]
  );
  return result.affectedRows;
}

export async function markAllRead(user_id) {
  const [result] = await pool.execute(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [user_id]
  );
  return result.affectedRows;
}

// Broadcast to all receptionists (and optionally admins)
export async function broadcastToRole(roles, { type, title, body, entity_type, entity_id }) {
  const placeholders = roles.map(() => '?').join(',');
  const [users] = await pool.execute(
    `SELECT id FROM users WHERE role IN (${placeholders}) AND is_active = 1`,
    roles
  );
  if (!users.length) return;
  const values = users.map(u => [u.id, type, title, body ?? null, entity_type ?? null, entity_id ?? null]);
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id) VALUES ?`,
    [values]
  );
}
