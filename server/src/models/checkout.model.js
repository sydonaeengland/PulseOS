import pool from '../config/db.js';

// Returns all completed visits that have not yet been checked out
export const getQueue = async () => {
  const [rows] = await pool.execute(
    `SELECT
       v.id                  AS visit_id,
       v.visit_type,
       v.updated_at          AS completed_at,
       v.follow_up_required,
       v.follow_up_date,
       v.follow_up_notes,
       p.id                  AS patient_id,
       p.first_name          AS patient_first_name,
       p.last_name           AS patient_last_name,
       p.phone               AS patient_phone,
       p.insurance_provider  AS patient_insurance_provider,
       u.first_name          AS doctor_first_name,
       u.last_name           AS doctor_last_name,
       u.id                  AS doctor_id,
       a.reason
     FROM visits v
     JOIN patients p ON p.id = v.patient_id
     JOIN users   u ON u.id = v.doctor_id
     LEFT JOIN appointments   a ON a.id = v.appointment_id
     LEFT JOIN checkouts      c ON c.visit_id = v.id
     WHERE v.status = 'completed' AND c.id IS NULL
     ORDER BY v.updated_at ASC`
  );
  return rows;
};

// Create a checkout with its line items inside a transaction; returns checkout insertId
export const create = async (checkoutData, lineItems) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      visit_id, patient_id, processed_by,
      payment_type, patient_payment_method,
      insurance_provider, insurance_amount_approved,
      insurance_provider_2, insurance_amount_approved_2,
      patient_balance, total_fee, receipt_reference,
    } = checkoutData;

    // Total insurance credit = primary + secondary
    const totalInsurance = (Number(insurance_amount_approved) || 0) + (Number(insurance_amount_approved_2) || 0);

    const [checkoutResult] = await conn.execute(
      `INSERT INTO checkouts
         (visit_id, patient_id, processed_by, payment_type, patient_payment_method,
          insurance_provider, insurance_amount_approved, patient_balance,
          total_fee, receipt_reference)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        visit_id,
        patient_id,
        processed_by ?? null,
        payment_type,
        patient_payment_method ?? null,
        [insurance_provider, insurance_provider_2].filter(Boolean).join(' + ') || null,
        totalInsurance,
        patient_balance,
        total_fee,
        receipt_reference,
      ]
    );

    const checkoutId = checkoutResult.insertId;

    if (Array.isArray(lineItems) && lineItems.length > 0) {
      for (const item of lineItems) {
        await conn.execute(
          'INSERT INTO checkout_line_items (checkout_id, description, amount_jmd) VALUES (?, ?, ?)',
          [checkoutId, item.description, item.amount_jmd]
        );
      }
    }

    await conn.commit();
    return checkoutId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// Fetch documents generated during a visit (OTC, sick certs, investigation requests)
export const getVisitDocuments = async (visitId) => {
  const [otc] = await pool.execute(
    'SELECT id, item_name, category, dosage, duration FROM otc_recommendations WHERE visit_id = ?',
    [visitId]
  );
  const [sickCerts] = await pool.execute(
    'SELECT id, diagnosis, unfit_for, date_unfit_from, date_unfit_to, certificate_reference FROM sick_certificates WHERE visit_id = ?',
    [visitId]
  );
  const [investigations] = await pool.execute(
    'SELECT id, test_name, category, priority, status FROM investigation_requests WHERE visit_id = ? ORDER BY created_at ASC',
    [visitId]
  );
  const [imaging] = await pool.execute(
    'SELECT id, modality, body_area, priority, status FROM imaging_requests WHERE visit_id = ? ORDER BY created_at ASC',
    [visitId]
  );
  const [prescriptions] = await pool.execute(
    `SELECT pr.id, pr.drug_name, pr.dosage, pr.route, pr.frequency, pr.duration_days,
            pr.quantity, pr.instructions, pr.nhf_covered,
            u.first_name AS doctor_first_name, u.last_name AS doctor_last_name
     FROM prescriptions pr
     JOIN visits v ON v.id = pr.visit_id
     JOIN users  u ON u.id = pr.prescribed_by
     WHERE pr.visit_id = ?
     ORDER BY pr.id ASC`,
    [visitId]
  );
  const [followUp] = await pool.execute(
    'SELECT follow_up_required, follow_up_date, follow_up_notes, doctor_id FROM visits WHERE id = ? LIMIT 1',
    [visitId]
  );
  return { otc, sick_certs: sickCerts, investigations, imaging, prescriptions, follow_up: followUp[0] ?? null };
};

// Fetch a checkout with its line items aggregated into an array
export const getByVisitId = async (visitId) => {
  const [rows] = await pool.execute(
    `SELECT
       c.*,
       cli.id          AS item_id,
       cli.description AS item_description,
       cli.amount_jmd  AS item_amount_jmd
     FROM checkouts c
     LEFT JOIN checkout_line_items cli ON cli.checkout_id = c.id
     WHERE c.visit_id = ?`,
    [visitId]
  );

  if (rows.length === 0) return null;

  // Group line items under the checkout row
  const checkoutMap = new Map();
  for (const row of rows) {
    if (!checkoutMap.has(row.id)) {
      const { item_id, item_description, item_amount_jmd, ...checkoutFields } = row;
      checkoutMap.set(row.id, { ...checkoutFields, line_items: [] });
    }
    if (row.item_id !== null) {
      checkoutMap.get(row.id).line_items.push({
        id:          row.item_id,
        description: row.item_description,
        amount_jmd:  row.item_amount_jmd,
      });
    }
  }

  return checkoutMap.values().next().value;
};
