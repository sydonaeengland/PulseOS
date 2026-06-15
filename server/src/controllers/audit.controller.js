import pool from '../config/db.js';
import { success, error } from '../utils/response.js';

const PAGE_SIZE = 20;

// GET /api/v1/audit?page=1
export const getPaginated = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM audit_log'
    );

    const [entries] = await pool.execute(
      `SELECT
         al.id, al.action, al.resource_type, al.resource_id,
         al.ip_address, al.details, al.created_at,
         al.user_id,
         u.first_name AS user_first_name,
         u.last_name  AS user_last_name,
         u.email      AS user_email
       FROM audit_log al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [PAGE_SIZE, offset]
    );

    const totalCount = Number(total);
    const pages = Math.ceil(totalCount / PAGE_SIZE);

    return success(res, { entries, total: totalCount, page, pages });
  } catch (err) {
    console.error('getPaginated audit error:', err);
    return error(res, 'Something went wrong', 500);
  }
};
