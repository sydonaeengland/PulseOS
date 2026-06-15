import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL;

export function getAuditLog(page = 1, token) {
  return axios.get(`${BASE}/audit-log`, {
    params: { page, limit: 20 },
    headers: { Authorization: `Bearer ${token}` },
  });
}
