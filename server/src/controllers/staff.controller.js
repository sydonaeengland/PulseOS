import bcrypt from 'bcrypt';
import * as Staff from '../models/staff.model.js';
import { success, error } from '../utils/response.js';
import { log, ACTIONS } from '../services/audit.service.js';

const withStaffId = (s) => s ? { ...s, staff_number: `SEDA-S${String(s.id).padStart(3, '0')}` } : s;
const withStaffIdMany = (arr) => arr.map(withStaffId);

export const listStaff = async (req, res) => {
  try {
    const { role } = req.query; // ?role=doctor, ?role=nurse, etc.
    const staff = withStaffIdMany(await Staff.listAll(role ?? null));
    return success(res, { staff });
  } catch (err) {
    console.error('listStaff error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

export const listDoctors = async (req, res) => {
  try {
    const doctors = withStaffIdMany(await Staff.listDoctors());
    return success(res, { doctors });
  } catch (err) {
    console.error('listDoctors error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// POST /api/v1/staff
export const createStaff = async (req, res) => {
  try {
    const {
      first_name, last_name, email, role, password,
      phone, mcj_number, designation,
    } = req.body;

    if (!first_name || !last_name || !email || !role || !password) {
      return error(res, 'first_name, last_name, email, role, and password are required', 400);
    }

    const VALID_ROLES = ['doctor', 'nurse', 'receptionist', 'admin'];
    if (!VALID_ROLES.includes(role)) {
      return error(res, `role must be one of: ${VALID_ROLES.join(', ')}`, 400);
    }

    const password_hash = await bcrypt.hash(password, 10);

    const insertId = await Staff.create({
      first_name, last_name, email, password_hash, role,
      phone:       phone ?? null,
      mcj_number:  mcj_number ?? null,
      designation: designation ?? null,
      created_by:  req.user.id,
    });

    log(req.user.id, ACTIONS.CREATE_STAFF, 'user', insertId, req.ip, {
      email, role,
    }).catch(() => {});

    return success(res, {
      staff: {
        id: insertId, first_name, last_name, email, role,
        phone: phone ?? null, mcj_number: mcj_number ?? null,
        designation: designation ?? null, is_active: 1,
      },
    }, 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return error(res, 'A user with that email already exists', 409);
    }
    console.error('createStaff error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// PATCH /api/v1/staff/:id/deactivate
export const deactivateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const affected = await Staff.deactivate(id);
    if (affected === 0) {
      return error(res, 'Staff member not found', 404);
    }

    log(req.user.id, ACTIONS.DEACTIVATE_STAFF, 'user', id, req.ip).catch(() => {});

    return success(res, { message: 'Staff member deactivated successfully' });
  } catch (err) {
    console.error('deactivateStaff error:', err);
    return error(res, 'Something went wrong', 500);
  }
};
