import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL;
const h = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export function getAppointments(token, date) {
  return axios.get(`${BASE}/appointments`, { params: date ? { date } : undefined, ...h(token) });
}
export function getAppointment(id, token) {
  return axios.get(`${BASE}/appointments/${id}`, h(token));
}
export function bookAppointment(data, token) {
  return axios.post(`${BASE}/appointments`, data, h(token));
}
export function checkinAppointment(id, token) {
  return axios.patch(`${BASE}/appointments/${id}/checkin`, {}, h(token));
}
export function undoCheckinAppointment(id, token) {
  return axios.patch(`${BASE}/appointments/${id}/undo-checkin`, {}, h(token));
}
export function cancelAppointment(id, token) {
  return axios.patch(`${BASE}/appointments/${id}/cancel`, {}, h(token));
}
export function noShowAppointment(id, token) {
  return axios.patch(`${BASE}/appointments/${id}/no-show`, {}, h(token));
}
export function getTodayAppointments(token) {
  return axios.get(`${BASE}/appointments`, h(token));
}
export function getTodayStats(token) {
  return axios.get(`${BASE}/appointments/today/stats`, h(token));
}
export function rescheduleAppointment(id, data, token) {
  return axios.patch(`${BASE}/appointments/${id}/reschedule`, data, h(token));
}
export function triageAppointment(id, urgency, token) {
  return axios.patch(`${BASE}/appointments/${id}/triage`, { urgency }, h(token));
}
export function triageCompleteAppointment(id, token) {
  return axios.patch(`${BASE}/appointments/${id}/triage-complete`, {}, h(token));
}
export function getDoctorView(token, date) {
  return axios.get(`${BASE}/appointments/doctor-view`, { params: date ? { date } : undefined, ...h(token) });
}
export function getDoctorViewWeek(token, start) {
  return axios.get(`${BASE}/appointments/doctor-view/week`, { params: { start }, ...h(token) });
}
export function getPatientVisits(patientId, token) {
  return axios.get(`${BASE}/visits/patient/${patientId}`, h(token));
}
export function getPatientPrescriptions(patientId, token) {
  return axios.get(`${BASE}/visits/patient/${patientId}/prescriptions`, h(token));
}
export function getPatientAppointments(patientId, token) {
  return axios.get(`${BASE}/appointments/patient/${patientId}`, h(token));
}

// Schedule API
export function getScheduleBlocked(token, params) {
  return axios.get(`${BASE}/schedules/blocked`, { params, ...h(token) });
}
export function createBlockedTime(data, token) {
  return axios.post(`${BASE}/schedules/blocked`, data, h(token));
}
export function deleteBlockedTime(id, doctorId, token) {
  return axios.delete(`${BASE}/schedules/blocked/${id}`, { data: { doctorId }, ...h(token) });
}
export function getDoctorWorkingHours(doctorId, token) {
  return axios.get(`${BASE}/schedules/working-hours/${doctorId}`, h(token));
}
export function saveDoctorWorkingHours(doctorId, hours, token) {
  return axios.put(`${BASE}/schedules/working-hours/${doctorId}`, { hours }, h(token));
}
