import pool from '../config/db.js';

// Create a new visit record; returns insertId
export const create = async (data) => {
  const {
    appointment_id, patient_id, doctor_id, created_by,
    visit_date, visit_time, visit_type, presenting_complaint,
  } = data;

  const [result] = await pool.execute(
    `INSERT INTO visits
       (appointment_id, patient_id, doctor_id, created_by,
        visit_date, visit_time, visit_type, presenting_complaint, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
    [
      appointment_id ?? null,
      patient_id,
      doctor_id,
      created_by ?? null,
      visit_date,
      visit_time,
      visit_type ?? null,
      presenting_complaint ?? null,
    ]
  );
  return result.insertId;
};

// All visits for a patient, newest first — with vitals + test/imaging counts
export const getByPatientId = async (patientId) => {
  const [rows] = await pool.execute(
    `SELECT
       v.*,
       u.first_name AS doctor_first_name,
       u.last_name  AS doctor_last_name,
       u.designation AS doctor_designation,
       vt.bp_systolic, vt.bp_diastolic, vt.temperature_celsius,
       vt.weight_kg, vt.pulse_bpm, vt.oxygen_saturation,
       (SELECT COUNT(*) FROM investigation_requests ir WHERE ir.visit_id = v.id) AS lab_count,
       (SELECT COUNT(*) FROM imaging_requests img WHERE img.visit_id = v.id) AS imaging_count,
       (SELECT GROUP_CONCAT(ir2.test_name ORDER BY ir2.id SEPARATOR ', ')
        FROM investigation_requests ir2 WHERE ir2.visit_id = v.id LIMIT 1) AS lab_tests,
       (SELECT GROUP_CONCAT(img2.imaging_type ORDER BY img2.id SEPARATOR ', ')
        FROM imaging_requests img2 WHERE img2.visit_id = v.id LIMIT 1) AS imaging_tests
     FROM visits v
     JOIN users u ON u.id = v.doctor_id
     LEFT JOIN vitals vt ON vt.visit_id = v.id
     WHERE v.patient_id = ?
     ORDER BY v.visit_date DESC, v.visit_time DESC`,
    [patientId]
  );
  return rows;
};

// Mark a visit as completed; returns affectedRows
export const complete = async (id) => {
  const [result] = await pool.execute(
    "UPDATE visits SET status = 'completed', updated_at = NOW() WHERE id = ?",
    [id]
  );
  return result.affectedRows;
};

// All prescriptions for a patient, newest first
export const getPrescriptionsByPatientId = async (patientId) => {
  const [rows] = await pool.execute(
    `SELECT
       p.id, p.drug_name, p.dosage, p.route, p.frequency, p.duration_days,
       p.quantity, p.instructions, p.reason, p.nhf_covered, p.status,
       p.created_at,
       u.first_name AS doctor_first_name, u.last_name AS doctor_last_name,
       v.visit_date
     FROM prescriptions p
     JOIN visits v ON v.id = p.visit_id
     JOIN users  u ON u.id = p.prescribed_by
     WHERE p.patient_id = ?
     ORDER BY p.created_at DESC`,
    [patientId]
  );
  return rows;
};

// Single visit with full patient + doctor details
export const getById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
       v.*,
       p.first_name    AS patient_first_name,
       p.last_name     AS patient_last_name,
       p.phone         AS patient_phone,
       p.date_of_birth AS patient_dob,
       u.first_name    AS doctor_first_name,
       u.last_name     AS doctor_last_name
     FROM visits v
     JOIN patients p ON p.id = v.patient_id
     JOIN users   u ON u.id = v.doctor_id
     WHERE v.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};
