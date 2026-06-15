import pool from '../config/db.js';

// All appointments for a given date (defaults to today)
export const listByDate = async (date) => {
  const [rows] = await pool.execute(
    `SELECT
       a.id, a.appointment_date, a.appointment_time, a.duration_minutes,
       a.visit_type, a.status, a.reason, a.triage_urgency, a.notes,
       a.patient_id,
       p.first_name AS patient_first_name, p.middle_name AS patient_middle_name, p.last_name AS patient_last_name,
       p.phone AS patient_phone, p.date_of_birth AS patient_dob,
       a.doctor_id,
       d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
       d.designation AS doctor_designation,
       a.booked_by,
       b.first_name AS booked_by_first_name, b.last_name AS booked_by_last_name
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users   d ON d.id = a.doctor_id
     LEFT JOIN users b ON b.id = a.booked_by
     WHERE a.appointment_date = ?
     ORDER BY a.appointment_time ASC`,
    [date]
  );
  return rows;
};

// Single appointment by id
export const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
       a.*,
       p.first_name AS patient_first_name, p.middle_name AS patient_middle_name, p.last_name AS patient_last_name,
       p.phone AS patient_phone, p.date_of_birth AS patient_dob,
       d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
       d.designation AS doctor_designation
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users   d ON d.id = a.doctor_id
     WHERE a.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

// All appointments for a date, grouped by doctor (for multi-column calendar)
export const listByDateAllDoctors = async (date) => {
  const [rows] = await pool.execute(
    `SELECT
       a.id, a.appointment_date, a.appointment_time, a.duration_minutes,
       a.visit_type, a.status, a.reason, a.triage_urgency, a.notes,
       a.patient_id,
       p.first_name AS patient_first_name, p.middle_name AS patient_middle_name, p.last_name AS patient_last_name,
       p.phone AS patient_phone,
       a.doctor_id,
       d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
       d.designation AS doctor_designation
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users   d ON d.id = a.doctor_id
     WHERE a.appointment_date = ?
       AND a.status NOT IN ('cancelled','no_show')
     ORDER BY a.doctor_id ASC, a.appointment_time ASC`,
    [date]
  );
  return rows;
};

// Appointments for a week range grouped for all doctors
export const listByWeekAllDoctors = async (startDate, endDate) => {
  const [rows] = await pool.execute(
    `SELECT
       a.id, a.appointment_date, a.appointment_time, a.duration_minutes,
       a.visit_type, a.status, a.reason, a.triage_urgency,
       a.patient_id,
       p.first_name AS patient_first_name, p.middle_name AS patient_middle_name, p.last_name AS patient_last_name,
       a.doctor_id,
       d.first_name AS doctor_first_name, d.last_name AS doctor_last_name
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users   d ON d.id = a.doctor_id
     WHERE a.appointment_date BETWEEN ? AND ?
       AND a.status NOT IN ('cancelled','no_show')
     ORDER BY a.appointment_date ASC, a.doctor_id ASC, a.appointment_time ASC`,
    [startDate, endDate]
  );
  return rows;
};

// All appointments for a specific patient, newest first
export const listByPatientId = async (patientId) => {
  const [rows] = await pool.execute(
    `SELECT
       a.id, a.appointment_date, a.appointment_time, a.duration_minutes,
       a.visit_type, a.status, a.reason, a.triage_urgency, a.notes,
       a.booked_by,
       d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
       d.designation AS doctor_designation,
       b.first_name AS booked_by_first_name, b.last_name AS booked_by_last_name
     FROM appointments a
     JOIN users d ON d.id = a.doctor_id
     LEFT JOIN users b ON b.id = a.booked_by
     WHERE a.patient_id = ?
     ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    [patientId]
  );
  return rows;
};

// Book a new appointment
export const create = async (data) => {
  const {
    patient_id, doctor_id, booked_by,
    appointment_date, appointment_time,
    duration_minutes, visit_type, reason, notes,
  } = data;

  const [result] = await pool.execute(
    `INSERT INTO appointments
       (patient_id, doctor_id, booked_by,
        appointment_date, appointment_time,
        duration_minutes, visit_type, reason, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
    [
      patient_id, doctor_id, booked_by ?? null,
      appointment_date, appointment_time,
      duration_minutes ?? 15,
      visit_type ?? null, reason ?? null, notes ?? null,
    ]
  );
  return result.insertId;
};

// Transition helpers — each returns affectedRows
export const checkin = async (id) => {
  const [result] = await pool.execute(
    "UPDATE appointments SET status = 'checked_in' WHERE id = ? AND status IN ('scheduled','confirmed')",
    [id]
  );
  return result.affectedRows;
};

// Undo a check-in — revert checked_in or triage back to scheduled
export const undoCheckin = async (id) => {
  const [result] = await pool.execute(
    "UPDATE appointments SET status = 'scheduled', triage_urgency = NULL WHERE id = ? AND status IN ('checked_in','triage')",
    [id]
  );
  return result.affectedRows;
};

export const triageAppointment = async (id, urgency) => {
  const [result] = await pool.execute(
    "UPDATE appointments SET status = 'triage', triage_urgency = ? WHERE id = ? AND status = 'checked_in'",
    [urgency ?? 'routine', id]
  );
  return result.affectedRows;
};

export const triageComplete = async (id) => {
  const [result] = await pool.execute(
    "UPDATE appointments SET status = 'waiting' WHERE id = ? AND status = 'triage'",
    [id]
  );
  return result.affectedRows;
};

export const cancel = async (id, staffId) => {
  const [result] = await pool.execute(
    "UPDATE appointments SET status = 'cancelled', notes = CONCAT(IFNULL(notes,''), ' [Cancelled by staff id:', ?, ']') WHERE id = ? AND status NOT IN ('completed','cancelled')",
    [staffId, id]
  );
  return result.affectedRows;
};

export const markNoShow = async (id) => {
  const [result] = await pool.execute(
    "UPDATE appointments SET status = 'no_show' WHERE id = ? AND status IN ('scheduled','confirmed')",
    [id]
  );
  return result.affectedRows;
};

// Check for time-slot conflicts for a doctor on a given date/time.
// Returns true if any existing (non-cancelled) appointment for that doctor
// overlaps the proposed [time, time + durationMinutes) window.
export const hasConflict = async (doctorId, date, time, durationMinutes, excludeId = null) => {
  const [rows] = await pool.execute(
    `SELECT id FROM appointments
     WHERE doctor_id = ?
       AND appointment_date = ?
       AND status NOT IN ('cancelled','no_show')
       AND id != ?
       AND appointment_time < ADDTIME(?, SEC_TO_TIME(? * 60))
       AND ADDTIME(appointment_time, SEC_TO_TIME(duration_minutes * 60)) > ?
     LIMIT 1`,
    [doctorId, date, excludeId ?? -1, time, durationMinutes, time]
  );
  return rows.length > 0;
};

// Returns counts for today's appointments
export const getTodayStats = async () => {
  const [rows] = await pool.execute(
    `SELECT
       COUNT(*) AS total,
       SUM(status = 'checked_in')  AS checked_in,
       SUM(status = 'completed')   AS completed,
       SUM(status = 'cancelled')   AS cancelled,
       SUM(status = 'scheduled')   AS scheduled
     FROM appointments
     WHERE appointment_date = CURDATE()`
  );
  const row = rows[0];
  return {
    total:      Number(row.total),
    checked_in: Number(row.checked_in),
    completed:  Number(row.completed),
    cancelled:  Number(row.cancelled),
    scheduled:  Number(row.scheduled),
  };
};

// Move an appointment to a new date/time and reset status to scheduled
export const reschedule = async (id, date, time) => {
  const [result] = await pool.execute(
    `UPDATE appointments
     SET appointment_date = ?, appointment_time = ?, status = 'scheduled'
     WHERE id = ?`,
    [date, time, id]
  );
  return result.affectedRows;
};
