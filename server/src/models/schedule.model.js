import pool from '../config/db.js';

// ─── Working hours ────────────────────────────────────────────────

export const getWorkingHours = async (doctorId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM doctor_working_hours WHERE doctor_id = ? ORDER BY day_of_week',
    [doctorId]
  );
  return rows;
};

export const getAllDoctorsWorkingHours = async () => {
  const [rows] = await pool.execute(
    `SELECT dwh.*, u.first_name, u.last_name
     FROM doctor_working_hours dwh
     JOIN users u ON u.id = dwh.doctor_id
     ORDER BY dwh.doctor_id, dwh.day_of_week`
  );
  return rows;
};

export const upsertWorkingHours = async (doctorId, dayOfWeek, startTime, endTime, isWorking, updatedBy) => {
  const [result] = await pool.execute(
    `INSERT INTO doctor_working_hours (doctor_id, day_of_week, start_time, end_time, is_working, updated_by)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       start_time  = VALUES(start_time),
       end_time    = VALUES(end_time),
       is_working  = VALUES(is_working),
       updated_by  = VALUES(updated_by)`,
    [doctorId, dayOfWeek, startTime, endTime, isWorking ? 1 : 0, updatedBy ?? null]
  );
  return result;
};

// ─── Blocked time ─────────────────────────────────────────────────

export const getBlockedTime = async (doctorId, date) => {
  const [rows] = await pool.execute(
    'SELECT * FROM blocked_time WHERE doctor_id = ? AND block_date = ? ORDER BY start_time',
    [doctorId, date]
  );
  return rows;
};

export const getBlockedTimeRange = async (startDate, endDate) => {
  const [rows] = await pool.execute(
    `SELECT bt.*, u.first_name, u.last_name
     FROM blocked_time bt
     JOIN users u ON u.id = bt.doctor_id
     WHERE bt.block_date BETWEEN ? AND ?
     ORDER BY bt.doctor_id, bt.block_date, bt.start_time`,
    [startDate, endDate]
  );
  return rows;
};

export const createBlockedTime = async (doctorId, date, startTime, endTime, reason, createdBy) => {
  const [result] = await pool.execute(
    `INSERT INTO blocked_time (doctor_id, block_date, start_time, end_time, reason, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [doctorId, date, startTime, endTime, reason ?? null, createdBy ?? null]
  );
  return result.insertId;
};

export const deleteBlockedTime = async (id, doctorId) => {
  const [result] = await pool.execute(
    'DELETE FROM blocked_time WHERE id = ? AND doctor_id = ?',
    [id, doctorId]
  );
  return result.affectedRows;
};
