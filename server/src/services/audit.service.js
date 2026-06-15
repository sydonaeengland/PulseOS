import pool from '../config/db.js';

// Action constants — used throughout controllers for consistent log entries
export const ACTIONS = {
  LOGIN:                  'LOGIN',
  LOGOUT:                 'LOGOUT',
  VIEW_PATIENT:           'VIEW_PATIENT',
  REGISTER_PATIENT:       'REGISTER_PATIENT',
  ACTIVATE_PATIENT:       'ACTIVATE_PATIENT',
  CREATE_APPOINTMENT:     'CREATE_APPOINTMENT',
  CHECKIN:                'CHECKIN',
  CANCEL_APPOINTMENT:     'CANCEL_APPOINTMENT',
  COMPLETE_VISIT:         'COMPLETE_VISIT',
  PROCESS_CHECKOUT:       'PROCESS_CHECKOUT',
  CREATE_STAFF:           'CREATE_STAFF',
  DEACTIVATE_STAFF:       'DEACTIVATE_STAFF',
  UPDATE_SETTINGS:        'UPDATE_SETTINGS',
  RESCHEDULE_APPOINTMENT: 'RESCHEDULE_APPOINTMENT',
  NO_SHOW:                'NO_SHOW',
};

/**
 * Write an audit log entry. Never throws — errors are swallowed silently so
 * a logging failure never aborts a business operation.
 *
 * @param {number|null} userId
 * @param {string}      action      — one of ACTIONS.*
 * @param {string|null} resourceType
 * @param {number|null} resourceId
 * @param {string|null} ipAddress
 * @param {object|null} details     — serialised as JSON
 */
export const log = async (userId, action, resourceType, resourceId, ipAddress, details) => {
  try {
    const detailsJson = details
      ? (typeof details === 'object' ? JSON.stringify(details) : String(details))
      : null;

    await pool.execute(
      `INSERT INTO audit_log
         (user_id, action, resource_type, resource_id, ip_address, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId      ?? null,
        action,
        resourceType ?? null,
        resourceId   ?? null,
        ipAddress    ?? null,
        detailsJson,
      ]
    );
  } catch (_err) {
    // Intentionally silenced — audit failures must not affect the caller
  }
};
