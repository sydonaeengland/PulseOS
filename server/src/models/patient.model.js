import pool from '../config/db.js';

export const findById = async (id) => {
  const [rows] = await pool.execute(
    "SELECT * FROM patients WHERE id = ? AND status != 'deleted' LIMIT 1",
    [id]
  );
  return rows[0] || null;
};

export const search = async (query) => {
  const term = `%${query}%`;
  const [rows] = await pool.execute(
    `SELECT id, first_name, middle_name, last_name, date_of_birth, phone, parish, status
     FROM patients
     WHERE (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?)
       AND status = 'active'
     LIMIT 20`,
    [term, term, term]
  );
  return rows;
};

export const create = async (patientData) => {
  const {
    first_name, middle_name, last_name, date_of_birth, sex,
    national_id, trn, phone, phone_secondary, email,
    preferred_contact, address, parish, occupation,
    marital_status, blood_type, insurance_provider, nhf_card_number,
    allergies_summary, registration_source, status,
    consent_given, consent_date, registered_by,
  } = patientData;

  const [result] = await pool.execute(
    `INSERT INTO patients (
      first_name, middle_name, last_name, date_of_birth, sex,
      national_id, trn, phone, phone_secondary, email,
      preferred_contact, address, parish, occupation,
      marital_status, blood_type, insurance_provider, nhf_card_number,
      allergies_summary, registration_source, status,
      consent_given, consent_date, registered_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      first_name, middle_name ?? null, last_name, date_of_birth, sex,
      national_id ?? null, trn ?? null, phone, phone_secondary ?? null, email ?? null,
      preferred_contact ?? 'call', address ?? null, parish ?? null, occupation ?? null,
      marital_status ?? null, blood_type ?? null, insurance_provider ?? null, nhf_card_number ?? null,
      allergies_summary ?? null, registration_source, status,
      consent_given ? 1 : 0, consent_date ?? null, registered_by ?? null,
    ]
  );
  return result.insertId;
};

export const update = async (id, fields) => {
  const allowed = [
    'first_name', 'middle_name', 'last_name', 'date_of_birth', 'sex',
    'national_id', 'trn', 'phone', 'phone_secondary', 'email',
    'preferred_contact', 'address', 'parish', 'occupation',
    'marital_status', 'blood_type', 'insurance_provider', 'nhf_card_number',
    'allergies_summary', 'consent_given', 'consent_date',
  ];

  const entries = Object.entries(fields).filter(([key]) => allowed.includes(key));
  if (entries.length === 0) return 0;

  const setClauses = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, val]) => val);

  const [result] = await pool.execute(
    `UPDATE patients SET ${setClauses} WHERE id = ?`,
    [...values, id]
  );
  return result.affectedRows;
};

export const findPending = async () => {
  const [rows] = await pool.execute(
    `SELECT id, first_name, last_name, date_of_birth, phone, parish, registration_source, created_at
     FROM patients
     WHERE status = 'pending_review'
     ORDER BY created_at ASC`
  );
  return rows;
};

export const activate = async (id, staffId) => {
  const [result] = await pool.execute(
    "UPDATE patients SET status = 'active', registered_by = ? WHERE id = ? AND status = 'pending_review'",
    [staffId, id]
  );
  return result.affectedRows;
};

export const checkDuplicate = async (firstName, lastName, dob, phone) => {
  const [rows] = await pool.execute(
    `SELECT id, first_name, last_name, date_of_birth, phone
     FROM patients
     WHERE first_name = ? AND last_name = ? AND date_of_birth = ? AND phone = ?
     LIMIT 1`,
    [firstName, lastName, dob, phone]
  );
  return rows[0] || null;
};
