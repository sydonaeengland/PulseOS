import { Router } from 'express';
import requireAuth from '../middleware/auth.middleware.js';
import requireRole from '../middleware/role.middleware.js';
import * as Schedule from '../models/schedule.model.js';
import { success, error } from '../utils/response.js';

const router = Router();

// GET /api/v1/schedules/working-hours/:doctorId
router.get('/working-hours/:doctorId', requireAuth, requireRole('receptionist', 'admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const rows = await Schedule.getWorkingHours(req.params.doctorId);
    return success(res, { working_hours: rows });
  } catch (err) {
    console.error('getWorkingHours error:', err);
    return error(res, 'Something went wrong', 500);
  }
});

// GET /api/v1/schedules/working-hours (all doctors)
router.get('/working-hours', requireAuth, requireRole('receptionist', 'admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const rows = await Schedule.getAllDoctorsWorkingHours();
    return success(res, { working_hours: rows });
  } catch (err) {
    console.error('getAllWorkingHours error:', err);
    return error(res, 'Something went wrong', 500);
  }
});

// PUT /api/v1/schedules/working-hours/:doctorId  (admin or the doctor themselves)
router.put('/working-hours/:doctorId', requireAuth, requireRole('receptionist', 'admin'), async (req, res) => {
  try {
    const { hours } = req.body; // array of { day_of_week, start_time, end_time, is_working }
    if (!Array.isArray(hours)) return error(res, 'hours must be an array', 400);
    await Promise.all(hours.map(h =>
      Schedule.upsertWorkingHours(
        req.params.doctorId, h.day_of_week, h.start_time, h.end_time, h.is_working ?? true, req.user.id
      )
    ));
    const updated = await Schedule.getWorkingHours(req.params.doctorId);
    return success(res, { working_hours: updated });
  } catch (err) {
    console.error('upsertWorkingHours error:', err);
    return error(res, 'Something went wrong', 500);
  }
});

// GET /api/v1/schedules/blocked?doctorId=&date=
router.get('/blocked', requireAuth, requireRole('receptionist', 'admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const { doctorId, date, start, end } = req.query;
    if (start && end) {
      const rows = await Schedule.getBlockedTimeRange(start, end);
      return success(res, { blocked: rows });
    }
    if (!doctorId || !date) return error(res, 'doctorId and date are required', 400);
    const rows = await Schedule.getBlockedTime(doctorId, date);
    return success(res, { blocked: rows });
  } catch (err) {
    console.error('getBlockedTime error:', err);
    return error(res, 'Something went wrong', 500);
  }
});

// POST /api/v1/schedules/blocked
router.post('/blocked', requireAuth, requireRole('receptionist', 'admin'), async (req, res) => {
  try {
    const { doctor_id, date, start_time, end_time, reason } = req.body;
    if (!doctor_id || !date || !start_time || !end_time) {
      return error(res, 'doctor_id, date, start_time, end_time are required', 400);
    }
    const id = await Schedule.createBlockedTime(doctor_id, date, start_time, end_time, reason, req.user.id);
    return success(res, { id }, 201);
  } catch (err) {
    console.error('createBlockedTime error:', err);
    return error(res, 'Something went wrong', 500);
  }
});

// DELETE /api/v1/schedules/blocked/:id
router.delete('/blocked/:id', requireAuth, requireRole('receptionist', 'admin'), async (req, res) => {
  try {
    const { doctorId } = req.body;
    const affected = await Schedule.deleteBlockedTime(req.params.id, doctorId);
    if (affected === 0) return error(res, 'Block not found', 404);
    return success(res, { deleted: true });
  } catch (err) {
    console.error('deleteBlockedTime error:', err);
    return error(res, 'Something went wrong', 500);
  }
});

export default router;
