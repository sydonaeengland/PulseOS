import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/notifications';

function IconBell({ hasUnread }) {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={hasUnread ? 2.2 : 1.75}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)        return 'Just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_COLORS = {
  patient_checked_in:     '#0EA5E9',
  appointment_booked:     '#10B981',
  self_registration:      '#8B5CF6',
  appointment_cancelled:  '#DC2626',
  pending_registration:   '#F59E0B',
};

const TYPE_LABELS = {
  patient_checked_in:     'Check-in',
  appointment_booked:     'Booked',
  self_registration:      'Self-reg',
  appointment_cancelled:  'Cancelled',
  pending_registration:   'Pending',
};

export default function NotificationBell() {
  const { token } = useAuth();
  const [open, setOpen]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(false);
  const dropRef                 = useRef(null);
  const pollRef                 = useRef(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await getNotifications(token);
      setNotifications(data.data?.notifications ?? []);
      setUnread(data.data?.unread ?? 0);
    } catch {}
  }, [token]);

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 30_000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = async () => {
    setOpen(prev => !prev);
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id, token);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAll = async () => {
    try {
      setLoading(true);
      await markAllNotificationsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnread(0);
    } catch {} finally {
      setLoading(false);
    }
  };

  const unreadCount = unread > 99 ? '99+' : unread;

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          position: 'relative',
          width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? '#F0F9FF' : 'transparent',
          border: `1px solid ${open ? '#BAE6FD' : 'transparent'}`,
          borderRadius: 9,
          cursor: 'pointer',
          color: unread > 0 ? '#0EA5E9' : '#64748B',
          transition: 'all 0.12s',
          flexShrink: 0,
        }}
      >
        <IconBell hasUnread={unread > 0} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            minWidth: 14, height: 14, borderRadius: 7,
            background: '#DC2626', border: '1.5px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 800, color: '#fff',
            padding: '0 3px', lineHeight: 1,
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 40, right: 0,
          width: 340, maxHeight: 480,
          background: '#fff', borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: '0 8px 32px rgba(15,23,42,0.12)',
          zIndex: 1000,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #F1F5F9',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Notifications</span>
              {unread > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#0EA5E9',
                  background: '#E0F2FE', borderRadius: 10,
                  padding: '1px 7px',
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={loading}
                style={{
                  fontSize: 11, color: '#0EA5E9', fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, opacity: loading ? 0.5 : 1,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '36px 20px', gap: 8,
              }}>
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#CBD5E1" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>No notifications</span>
              </div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                style={{
                  display: 'flex', gap: 11,
                  padding: '11px 16px',
                  borderBottom: '1px solid #F8FAFC',
                  background: n.is_read ? '#fff' : '#F0F9FF',
                  cursor: n.is_read ? 'default' : 'pointer',
                  transition: 'background 0.1s',
                }}
              >
                {/* Type badge dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                  background: TYPE_COLORS[n.type] ?? '#94A3B8',
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.3px',
                        color: TYPE_COLORS[n.type] ?? '#94A3B8',
                        textTransform: 'uppercase',
                      }}>
                        {TYPE_LABELS[n.type] ?? n.type}
                      </span>
                      <div style={{ fontSize: 12, fontWeight: n.is_read ? 500 : 700, color: '#0F172A', marginTop: 1, lineHeight: 1.35 }}>
                        {n.title}
                      </div>
                    </div>
                    {!n.is_read && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                  {n.body && (
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 1.4 }}>
                      {n.body}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
