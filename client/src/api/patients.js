import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL;

export function listPatients(token) {
  return axios.get(`${BASE}/patients`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPendingPatients(token) {
  return axios.get(`${BASE}/patients/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function activatePatient(id, token) {
  return axios.patch(`${BASE}/patients/${id}/activate`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function searchPatients(q, token) {
  return axios.get(`${BASE}/patients/search`, {
    params: { q },
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPatient(id, token) {
  return axios.get(`${BASE}/patients/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function registerPatient(data, token) {
  return axios.post(`${BASE}/patients`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function selfRegisterPatient(data) {
  return axios.post(`${BASE}/register/self`, data);
}
