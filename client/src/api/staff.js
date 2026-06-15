import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL;

export function getStaff(token) {
  return axios.get(`${BASE}/staff`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getDoctors(token) {
  return axios.get(`${BASE}/staff/doctors`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createStaff(data, token) {
  return axios.post(`${BASE}/staff`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function deactivateStaff(id, token) {
  return axios.patch(`${BASE}/staff/${id}/deactivate`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
