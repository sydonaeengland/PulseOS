import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL;
const h = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export function getNotifications(token) {
  return axios.get(`${BASE}/notifications`, h(token));
}
export function getUnreadCount(token) {
  return axios.get(`${BASE}/notifications/unread-count`, h(token));
}
export function markNotificationRead(id, token) {
  return axios.patch(`${BASE}/notifications/${id}/read`, {}, h(token));
}
export function markAllNotificationsRead(token) {
  return axios.patch(`${BASE}/notifications/read-all`, {}, h(token));
}
