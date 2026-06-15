import pool from '../config/db.js';

// All active staff, optionally filtered by role
export const listAll = async (role = null) => {
  const params = [];
  let sql = `
    SELECT id, first_name, last_name, email, role, phone,
           mcj_number, designation, is_active, created_at
    FROM users
    WHERE is_active = 1
  `;
  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }
  sql += ' ORDER BY last_name, first_name';
  const [rows] = await pool.execute(sql, params);
  return rows;
};

// Convenience: only doctors (used in appointment booking dropdown)
export const listDoctors = async () => listAll('doctor');

// Insert a new staff user; returns insertId
export const create = async (data) => {
  const {
    first_name, last_name, email, password_hash,
    role, phone, mcj_number, designation, created_by,
  } = data;
  const [result] = await pool.execute(
    `INSERT INTO users
       (first_name, last_name, email, password_hash, role, phone,
        mcj_number, designation, created_by, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      first_name, last_name, email, password_hash,
      role, phone ?? null, mcj_number ?? null,
      designation ?? null, created_by ?? null,
    ]
  );
  return result.insertId;
};

// Soft-delete: mark user inactive; returns affectedRows
export const deactivate = async (id) => {
  const [result] = await pool.execute(
    'UPDATE users SET is_active = 0 WHERE id = ?',
    [id]
  );
  return result.affectedRows;
};
