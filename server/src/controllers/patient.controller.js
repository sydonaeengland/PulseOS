import * as Patient from '../models/patient.model.js';
import { success, error } from '../utils/response.js';

const IMMUTABLE_FIELDS = ['id', 'created_at', 'updated_at', 'status', 'registration_source'];

// Attach a formatted patient number — PID-00001
const withPid = (p) => p ? { ...p, patient_number: `SEDA-${String(p.id).padStart(5, '0')}` } : p;
const withPidMany = (arr) => arr.map(withPid);

export const listPatients = async (req, res) => {
  try {
    const patients = withPidMany(await Patient.listAll());
    return success(res, { patients });
  } catch (err) {
    console.error('listPatients error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

export const registerPatient = async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, sex, phone, consent_given } = req.body;

    if (!first_name || !last_name || !date_of_birth || !sex || !phone || consent_given === undefined) {
      return error(res, 'first_name, last_name, date_of_birth, sex, phone, and consent_given are required', 400);
    }

    const duplicate = await Patient.checkDuplicate(first_name, last_name, date_of_birth, phone);
    if (duplicate) {
      return res.status(409).json({ success: false, error: 'A patient with this name, date of birth, and phone number already exists', existingId: duplicate.id });
    }

    const insertId = await Patient.create({
      ...req.body,
      registration_source: 'staff',
      status: 'active',
      registered_by: req.user.id,
    });

    const patient = withPid(await Patient.findById(insertId));
    return success(res, { patient }, 201);
  } catch (err) {
    console.error('registerPatient error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

export const selfRegister = async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, sex, phone, consent_given } = req.body;

    if (!first_name || !last_name || !date_of_birth || !sex || !phone || consent_given === undefined) {
      return error(res, 'first_name, last_name, date_of_birth, sex, phone, and consent_given are required', 400);
    }

    if (!consent_given) {
      return error(res, 'Consent must be given to register', 400);
    }

    const duplicate = await Patient.checkDuplicate(first_name, last_name, date_of_birth, phone);
    if (duplicate) {
      return res.status(409).json({ success: false, error: 'A record with this name, date of birth, and phone number already exists', existingId: duplicate.id });
    }

    const insertId = await Patient.create({
      ...req.body,
      registration_source: 'self_registration',
      status: 'pending_review',
      registered_by: null,
    });

    return success(res, { id: insertId, message: 'Registration received — a staff member will review your details shortly' }, 201);
  } catch (err) {
    console.error('selfRegister error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

export const getPatient = async (req, res) => {
  try {
    const patient = withPid(await Patient.findById(req.params.id));
    if (!patient) {
      return error(res, 'Patient not found', 404);
    }
    return success(res, { patient });
  } catch (err) {
    console.error('getPatient error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

export const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return error(res, 'Search query must be at least 2 characters', 400);
    }
    const patients = withPidMany(await Patient.search(q.trim()));
    return success(res, { patients });
  } catch (err) {
    console.error('searchPatients error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

export const getPendingPatients = async (req, res) => {
  try {
    const patients = withPidMany(await Patient.findPending());
    return success(res, { patients });
  } catch (err) {
    console.error('getPendingPatients error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

export const activatePatient = async (req, res) => {
  try {
    const affected = await Patient.activate(req.params.id, req.user.id);
    if (affected === 0) {
      return error(res, 'Patient not found or already active', 404);
    }
    const patient = withPid(await Patient.findById(req.params.id));
    return success(res, { patient });
  } catch (err) {
    console.error('activatePatient error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

export const updatePatient = async (req, res) => {
  try {
    const fields = { ...req.body };
    IMMUTABLE_FIELDS.forEach((f) => delete fields[f]);

    if (Object.keys(fields).length === 0) {
      return error(res, 'No updatable fields provided', 400);
    }

    const affected = await Patient.update(req.params.id, fields);
    if (affected === 0) {
      return error(res, 'Patient not found', 404);
    }

    const patient = withPid(await Patient.findById(req.params.id));
    return success(res, { patient });
  } catch (err) {
    console.error('updatePatient error:', err);
    return error(res, 'Something went wrong', 500);
  }
};
