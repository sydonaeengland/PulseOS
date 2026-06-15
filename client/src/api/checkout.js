import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL;
const h = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export function getCheckoutQueue(token) {
  return axios.get(`${BASE}/checkout/queue`, h(token));
}

export function processCheckout(data, token) {
  return axios.post(`${BASE}/checkout`, data, h(token));
}

export function getCheckoutByVisit(visitId, token) {
  return axios.get(`${BASE}/checkout/visit/${visitId}`, h(token));
}

export function getVisitDocuments(visitId, token) {
  return axios.get(`${BASE}/checkout/visit/${visitId}/documents`, h(token));
}
