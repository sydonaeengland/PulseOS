import pool from '../config/db.js';

export const findByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1',
    [email]
  );
  return rows[0] || null;
};

export const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, first_name, last_name, email, role, phone, is_active, created_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
};

export const create = async (userData) => {
  const { first_name, last_name, email, password_hash, role, phone, created_by } = userData;
  const [result] = await pool.execute(
    'INSERT INTO users (first_name, last_name, email, password_hash, role, phone, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [first_name, last_name, email, password_hash, role, phone ?? null, created_by ?? null]
  );
  return result.insertId;
};

export const updateLastSeen = async (id) => {
  await pool.execute(
    'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id]
  );
};
