import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPendingPatients } from '../../api/patients';

function IconSearch() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function Avatar({ user }) {
  const initials =
    ((user?.first_name ?? '').charAt(0) + (user?.last_name ?? '').charAt(0)).toUpperCase() || 'A';
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      background: '#1E3A5F',
      border: '2px solid #2D5A8E',
      color: '#00B37E',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 800, letterSpacing: '0.3px', flexShrink: 0,
      userSelect: 'none',
    }}>
      {initials}
    </div>
  );
}

// ─── Notification panel ────────────────────────────────────────────

function NotifIcon({ type }) {
  if (type === 'pending')  return <IconUser />;
  if (type === 'success')  return <IconCheck />;
  return <IconInfo />;
}

function notifIconStyle(type) {
  if (type === 'pending')  return { background: '#FFF7ED', color: '#D97706' };
  if (type === 'success')  return { background: '#F0FDF9', color: '#059669' };
  return { background: '#EFF6FF', color: '#1E3A5F' };
}

function NotificationPanel({ pendingPatients, onClose, onMarkAllRead, unreadCount }) {
  const navigate = useNavigate();
  const [hovIdx, setHovIdx] = useState(null);

  // Build notification list from real data + structural items
  const notifications = [
    ...(pendingPatients.length > 0 ? [{
      id: 'pending',
      type: 'pending',
      title: `${pendingPatients.length} patient${pendingPatients.length > 1 ? 's' : ''} pending review`,
      body: pendingPatients.slice(0, 2).map(p => `${p.first_name} ${p.last_name}`).join(', ') +
            (pendingPatients.length > 2 ? ` +${pendingPatients.length - 2} more` : ''),
      time: 'Now',
      action: () => { navigate('/admin/patients'); onClose(); },
      actionLabel: 'Review →',
      unread: true,
    }] : []),
    {
      id: 'sys-1',
      type: 'info',
      title: 'Audit log endpoint',
      body: 'GET /api/v1/audit-log is not yet implemented. Logs will appear once live.',
      time: 'System',
      unread: false,
    },
    {
      id: 'sys-2',
      type: 'success',
      title: 'System healthy',
      body: 'All services are running normally.',
      time: 'Today',
      unread: false,
    },
  ];

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
      width: 320, zIndex: 200,
      background: '#FFFFFF',
      border: '1px solid #EEF2F7',
      borderRadius: 14,
      boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px 10px',
        borderBottom: '1px solid #F1F5F9',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 800, color: '#FFFFFF',
              background: '#0EA5E9', borderRadius: 20, padding: '2px 6px',
              letterSpacing: '0.2px',
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              style={{
                fontSize: 11, fontWeight: 500, color: '#64748B',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: '#F8FAFC', border: '1px solid #F1F5F9',
              borderRadius: 6, cursor: 'pointer', padding: '3px 4px',
              display: 'flex', alignItems: 'center', color: '#94A3B8',
            }}
          >
            <IconX />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notifications.map((n, i) => (
          <div
            key={n.id}
            onMouseEnter={() => setHovIdx(i)}
            onMouseLeave={() => setHovIdx(null)}
            style={{
              display: 'flex', gap: 12, padding: '12px 16px',
              background: hovIdx === i ? '#F8FAFC' : n.unread ? '#FAFFFE' : '#FFFFFF',
              borderBottom: i < notifications.length - 1 ? '1px solid #F8FAFC' : 'none',
              cursor: n.action ? 'pointer' : 'default',
              transition: 'background 0.1s',
              position: 'relative',
            }}
            onClick={n.action}
          >
            {/* Unread indicator */}
            {n.unread && (
              <div style={{
                position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
                width: 4, height: 4, borderRadius: '50%', background: '#00B37E',
              }} />
            )}

            {/* Icon bubble */}
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...notifIconStyle(n.type),
            }}>
              <NotifIcon type={n.type} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: n.unread ? 700 : 500, color: '#0F172A', lineHeight: 1.35 }}>
                  {n.title}
                </div>
                <span style={{ fontSize: 10, color: '#CBD5E1', flexShrink: 0, marginTop: 1 }}>{n.time}</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 1.4 }}>
                {n.body}
              </div>
              {n.actionLabel && (
                <div style={{ fontSize: 11, fontWeight: 600, color: '#1E3A5F', marginTop: 5 }}>
                  {n.actionLabel}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid #F1F5F9',
        background: '#FAFBFC',
      }}>
        <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
          More notification types will appear as features go live
        </div>
      </div>
    </div>
  );
}

// ─── TopBar ────────────────────────────────────────────────────────

export default function TopBar({ title, breadcrumb, user }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused]     = useState(false);
  const [bellOpen, setBellOpen]               = useState(false);
  const [bellHov, setBellHov]                 = useState(false);
  const [pendingPatients, setPendingPatients] = useState([]);
  const [markedRead, setMarkedRead]           = useState(false);
  const panelRef = useRef(null);

  // Fetch pending patients — the only live data source right now
  useEffect(() => {
    if (!token) return;
    getPendingPatients(token)
      .then(r => setPendingPatients(r.data.data ?? []))
      .catch(() => {});
  }, [token]);

  // Close panel on outside click
  useEffect(() => {
    if (!bellOpen) return;
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  const unreadCount = markedRead ? 0 : pendingPatients.length > 0 ? 1 : 0;
  const hasUnread = unreadCount > 0;

  return (
    <header style={{
      height: 54, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      background: '#FFFFFF',
      borderBottom: '1px solid #EEF2F7',
    }}>

      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {breadcrumb && (
          <>
            <span style={{ fontSize: 12, color: '#CBD5E1' }}>{breadcrumb}</span>
            <span style={{ color: '#E2E8F0', display: 'flex' }}><IconChevronRight /></span>
          </>
        )}
        <h1 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h1>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Search pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: searchFocused ? '#FFFFFF' : '#F8FAFC',
          border: `1px solid ${searchFocused ? '#1B4F72' : '#EEF2F7'}`,
          borderRadius: 20, padding: '5px 12px',
          transition: 'all 0.14s', cursor: 'text',
          boxShadow: searchFocused ? '0 0 0 3px rgba(27,79,114,0.08)' : 'none',
        }}>
          <span style={{ color: '#94A3B8', display: 'flex', flexShrink: 0 }}><IconSearch /></span>
          <input
            placeholder="Search..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 12, color: '#0F172A', width: 130,
            }}
          />
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#CBD5E1',
            background: '#F1F5F9', border: '1px solid #E2E8F0',
            borderRadius: 4, padding: '1px 4px', letterSpacing: '0.3px',
            flexShrink: 0,
          }}>Ctrl K</span>
        </div>

        {/* Bell + notification panel */}
        <div ref={panelRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setBellOpen(o => !o); setMarkedRead(false); }}
            onMouseEnter={() => setBellHov(true)}
            onMouseLeave={() => setBellHov(false)}
            title="Notifications"
            style={{
              background: bellOpen || bellHov ? '#F1F5F9' : 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer', padding: '6px 7px', borderRadius: 8,
              display: 'flex', alignItems: 'center',
              color: bellOpen || bellHov ? '#1B4F72' : '#94A3B8',
              transition: 'all 0.14s',
            }}
          >
            <IconBell />
          </button>

          {/* Dot — only shown when there are unread notifications */}
          {hasUnread && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 6, height: 6, borderRadius: '50%',
              background: '#0EA5E9',
              border: '1.5px solid #FFFFFF',
              pointerEvents: 'none',
            }} />
          )}

          {bellOpen && (
            <NotificationPanel
              pendingPatients={pendingPatients}
              unreadCount={unreadCount}
              onClose={() => setBellOpen(false)}
              onMarkAllRead={() => setMarkedRead(true)}
            />
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: '#E2E8F0' }} />

        {/* User identity */}
        {user && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => navigate('/admin/settings')}
            title="Settings"
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                {user.first_name} {user.last_name}
              </div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1, textTransform: 'capitalize' }}>
                {user.role ?? 'Admin'}
              </div>
            </div>
            <Avatar user={user} />
          </div>
        )}
      </div>
    </header>
  );
}
