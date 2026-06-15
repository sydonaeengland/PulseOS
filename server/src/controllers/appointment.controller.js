import * as Appointment from '../models/appointment.model.js';
import * as Visit from '../models/visit.model.js';
import * as Notification from '../models/notification.model.js';
import { success, error } from '../utils/response.js';
import { log, ACTIONS } from '../services/audit.service.js';
import pool from '../config/db.js';

// GET /api/v1/appointments/patient/:patientId
export const listByPatient = async (req, res) => {
  try {
    const appts = await Appointment.listByPatientId(req.params.patientId);
    return success(res, { appointments: appts });
  } catch (err) {
    console.error('listByPatient error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// GET /api/v1/appointments?date=YYYY-MM-DD
// date defaults to today if omitted
export const listAppointments = async (req, res) => {
  try {
    const date = req.query.date ?? new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return error(res, 'date must be in YYYY-MM-DD format', 400);
    }
    const appointments = await Appointment.listByDate(date);
    return success(res, { appointments, date });
  } catch (err) {
    console.error('listAppointments error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// GET /api/v1/appointments/today/stats
export const getTodayStats = async (req, res) => {
  try {
    const stats = await Appointment.getTodayStats();
    return success(res, { stats });
  } catch (err) {
    console.error('getTodayStats error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// GET /api/v1/appointments/:id
export const getAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return error(res, 'Appointment not found', 404);
    return success(res, { appointment: appt });
  } catch (err) {
    console.error('getAppointment error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// POST /api/v1/appointments
export const bookAppointment = async (req, res) => {
  try {
    const {
      patient_id, doctor_id,
      appointment_date, appointment_time,
      duration_minutes, visit_type, reason, notes,
    } = req.body;

    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return error(res, 'patient_id, doctor_id, appointment_date, and appointment_time are required', 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) {
      return error(res, 'appointment_date must be YYYY-MM-DD', 400);
    }
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(appointment_time)) {
      return error(res, 'appointment_time must be HH:MM or HH:MM:SS', 400);
    }

    const conflict = await Appointment.hasConflict(
      doctor_id, appointment_date, appointment_time, duration_minutes ?? 15
    );
    if (conflict) {
      return error(res, 'Doctor already has an appointment in this time slot', 409);
    }

    const insertId = await Appointment.create({
      patient_id, doctor_id,
      booked_by: req.user.id,
      appointment_date, appointment_time,
      duration_minutes, visit_type, reason, notes,
    });

    const appt = await Appointment.findById(insertId);

    // Notify all receptionists about the new booking
    const patientName = `${appt.patient_first_name ?? ''} ${appt.patient_last_name ?? ''}`.trim() || 'a patient';
    const doctorName  = `Dr. ${appt.doctor_last_name ?? ''}`.trim();
    Notification.broadcastToRole(['receptionist', 'admin'], {
      type: 'appointment_booked',
      title: 'New Appointment Booked',
      body: `${patientName} with ${doctorName} on ${appt.appointment_date} at ${(appt.appointment_time ?? '').slice(0,5)}`,
      entity_type: 'appointment',
      entity_id: insertId,
    }).catch(() => {});

    return success(res, { appointment: appt }, 201);
  } catch (err) {
    console.error('bookAppointment error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// PATCH /api/v1/appointments/:id/checkin
// Auto-advances to triage immediately after check-in
export const checkinAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const affected = await Appointment.checkin(id);
    if (affected === 0) {
      return error(res, 'Appointment not found or cannot be checked in (wrong status)', 400);
    }

    // Automatically advance to triage
    await Appointment.triageAppointment(id, 'routine');

    const appt = await Appointment.findById(id);

    // Create a visit record for this check-in
    const now = new Date();
    const visitDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const visitTime = now.toTimeString().slice(0, 8);
    const visitId = await Visit.create({
      appointment_id: id,
      patient_id:     appt.patient_id,
      doctor_id:      appt.doctor_id,
      created_by:     req.user.id,
      visit_date:     visitDate,
      visit_time:     visitTime,
      visit_type:     appt.visit_type ?? null,
      presenting_complaint: null,
    });

    log(req.user.id, ACTIONS.CHECKIN, 'appointment', id, req.ip, { visit_id: visitId }).catch(() => {});

    // Notify receptionists, admin, and triage nurses about the check-in
    const pName = `${appt.patient_first_name ?? ''} ${appt.patient_last_name ?? ''}`.trim() || 'A patient';
    Notification.broadcastToRole(['receptionist', 'admin', 'nurse'], {
      type: 'patient_checked_in',
      title: 'Patient Checked In',
      body: `${pName} has checked in and is now in triage`,
      entity_type: 'appointment',
      entity_id: Number(id),
    }).catch(() => {});

    return success(res, { appointment: appt, visit_id: visitId });
  } catch (err) {
    console.error('checkinAppointment error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// PATCH /api/v1/appointments/:id/cancel
export const cancelAppointment = async (req, res) => {
  try {
    const affected = await Appointment.cancel(req.params.id, req.user.id);
    if (affected === 0) {
      return error(res, 'Appointment not found or already completed/cancelled', 400);
    }
    const appt = await Appointment.findById(req.params.id);
    return success(res, { appointment: appt });
  } catch (err) {
    console.error('cancelAppointment error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// PATCH /api/v1/appointments/:id/no-show
export const noShowAppointment = async (req, res) => {
  try {
    const affected = await Appointment.markNoShow(req.params.id);
    if (affected === 0) {
      return error(res, 'Appointment not found or cannot be marked no-show', 400);
    }
    const appt = await Appointment.findById(req.params.id);
    return success(res, { appointment: appt });
  } catch (err) {
    console.error('noShowAppointment error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// GET /api/v1/appointments/doctor-view?date=YYYY-MM-DD
export const getDoctorView = async (req, res) => {
  try {
    const date = req.query.date ?? new Date().toISOString().slice(0, 10);
    const appointments = await Appointment.listByDateAllDoctors(date);
    const [doctors] = await pool.execute(
      "SELECT id, first_name, last_name, designation FROM users WHERE role='doctor' AND is_active=1 ORDER BY first_name"
    );
    // Attach today's working hours to each doctor (day_of_week 0=Sun … 6=Sat)
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    const [hours] = await pool.execute(
      'SELECT doctor_id, start_time, end_time, is_working FROM doctor_working_hours WHERE day_of_week = ?',
      [dayOfWeek]
    );
    const hoursMap = Object.fromEntries(hours.map(h => [h.doctor_id, h]));
    const doctorsWithHours = doctors.map(d => ({ ...d, working_hours: hoursMap[d.id] ?? null }));
    return success(res, { appointments, doctors: doctorsWithHours, date });
  } catch (err) {
    console.error('getDoctorView error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// GET /api/v1/appointments/doctor-view/week?start=YYYY-MM-DD&end=YYYY-MM-DD
export const getDoctorViewWeek = async (req, res) => {
  try {
    const start = req.query.start ?? new Date().toISOString().slice(0, 10);
    const d = new Date(start + 'T00:00:00');
    d.setDate(d.getDate() + 6);
    const end = req.query.end ?? d.toISOString().slice(0, 10);
    const appointments = await Appointment.listByWeekAllDoctors(start, end);
    const [doctors] = await pool.execute(
      "SELECT id, first_name, last_name, designation FROM users WHERE role='doctor' AND is_active=1 ORDER BY first_name"
    );
    return success(res, { appointments, doctors, start, end });
  } catch (err) {
    console.error('getDoctorViewWeek error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// PATCH /api/v1/appointments/:id/triage
export const triageAppointment = async (req, res) => {
  try {
    const { urgency } = req.body; // 'routine' | 'urgent' | 'emergency'
    const affected = await Appointment.triageAppointment(req.params.id, urgency ?? 'routine');
    if (affected === 0) return error(res, 'Appointment not found or not in checked_in status', 400);
    const appt = await Appointment.findById(req.params.id);
    return success(res, { appointment: appt });
  } catch (err) {
    console.error('triageAppointment error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// PATCH /api/v1/appointments/:id/triage-complete
export const triageComplete = async (req, res) => {
  try {
    const affected = await Appointment.triageComplete(req.params.id);
    if (affected === 0) return error(res, 'Appointment not found or not in triage status', 400);
    const appt = await Appointment.findById(req.params.id);
    return success(res, { appointment: appt });
  } catch (err) {
    console.error('triageComplete error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// PATCH /api/v1/appointments/:id/undo-checkin
export const undoCheckin = async (req, res) => {
  try {
    // Also delete the visit record created at check-in time
    await pool.execute(
      "DELETE FROM visits WHERE appointment_id = ? AND status = 'open'",
      [req.params.id]
    );
    const affected = await Appointment.undoCheckin(req.params.id);
    if (affected === 0) return error(res, 'Appointment not found or not in checked_in status', 400);
    const appt = await Appointment.findById(req.params.id);
    return success(res, { appointment: appt });
  } catch (err) {
    console.error('undoCheckin error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

// PATCH /api/v1/appointments/:id/reschedule
export const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time } = req.body;

    if (!appointment_date || !appointment_time) {
      return error(res, 'appointment_date and appointment_time are required', 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) {
      return error(res, 'appointment_date must be YYYY-MM-DD', 400);
    }
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(appointment_time)) {
      return error(res, 'appointment_time must be HH:MM or HH:MM:SS', 400);
    }

    const existing = await Appointment.findById(id);
    if (!existing) return error(res, 'Appointment not found', 404);

    const conflict = await Appointment.hasConflict(
      existing.doctor_id, appointment_date, appointment_time,
      existing.duration_minutes ?? 15, id
    );
    if (conflict) {
      return error(res, 'Doctor already has an appointment in this time slot', 409);
    }

    const affected = await Appointment.reschedule(id, appointment_date, appointment_time);
    if (affected === 0) {
      return error(res, 'Appointment could not be rescheduled', 400);
    }

    const appt = await Appointment.findById(id);

    log(req.user.id, ACTIONS.RESCHEDULE_APPOINTMENT, 'appointment', id, req.ip, {
      appointment_date, appointment_time,
    }).catch(() => {});

    return success(res, { appointment: appt });
  } catch (err) {
    console.error('rescheduleAppointment error:', err);
    return error(res, 'Something went wrong', 500);
  }
};
