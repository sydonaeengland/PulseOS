import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL;

export function getSettings(token) {
  return axios.get(`${BASE}/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateSettings(data, token) {
  return axios.patch(`${BASE}/settings`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getVisitTypeFees(token) {
  return axios.get(`${BASE}/settings/fees`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateFee(visitType, amountJmd, token) {
  return axios.patch(`${BASE}/settings/fees/${encodeURIComponent(visitType)}`, { amount_jmd: amountJmd }, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
