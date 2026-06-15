import pool from '../config/db.js';

// Fetch the single facility settings row
export const get = async () => {
  const [rows] = await pool.execute('SELECT * FROM facility_settings LIMIT 1');
  return rows[0] || null;
};

// Upsert facility settings (single-row table keyed by a fixed id or unique constraint)
export const upsert = async (data) => {
  const {
    clinic_name, address_line_1, address_line_2, parish,
    phone, email, registration_number, receipt_prefix, updated_by,
  } = data;

  const [result] = await pool.execute(
    `INSERT INTO facility_settings
       (clinic_name, address_line_1, address_line_2, parish,
        phone, email, registration_number, receipt_prefix, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       clinic_name         = VALUES(clinic_name),
       address_line_1      = VALUES(address_line_1),
       address_line_2      = VALUES(address_line_2),
       parish              = VALUES(parish),
       phone               = VALUES(phone),
       email               = VALUES(email),
       registration_number = VALUES(registration_number),
       receipt_prefix      = VALUES(receipt_prefix),
       updated_by          = VALUES(updated_by),
       updated_at          = NOW()`,
    [
      clinic_name ?? null,
      address_line_1 ?? null,
      address_line_2 ?? null,
      parish ?? null,
      phone ?? null,
      email ?? null,
      registration_number ?? null,
      receipt_prefix ?? null,
      updated_by ?? null,
    ]
  );
  return result;
};

// Fetch all visit type fees ordered by type name
export const getFees = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM visit_type_fees ORDER BY visit_type'
  );
  return rows;
};

// Upsert a single visit type fee
export const upsertFee = async (visitType, feeJmd, updatedBy) => {
  const [result] = await pool.execute(
    `INSERT INTO visit_type_fees (visit_type, fee_jmd, updated_by)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE fee_jmd = ?, updated_by = ?`,
    [visitType, feeJmd, updatedBy, feeJmd, updatedBy]
  );
  return result;
};
