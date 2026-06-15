import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSettings } from '../../api/settings';
import { deriveAbbreviation } from '../../pages/admin/AdminSettings';

function IconHome() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconPatients() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function IconStaff() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconAudit() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconToggle({ collapsed }) {
  return collapsed ? (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ) : (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

// Nav grouped by section — matches MedCore/Medioverse reference pattern
const NAV_SECTIONS = [
  {
    label: 'Main Menu',
    items: [
      { to: '/admin',          label: 'Dashboard', Icon: IconHome,     end: true },
      { to: '/admin/patients', label: 'Patients',  Icon: IconPatients, end: false },
      { to: '/admin/staff',    label: 'Staff',     Icon: IconStaff,    end: false },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/audit-log', label: 'Audit Log', Icon: IconAudit,    end: false },
      { to: '/admin/settings',  label: 'Settings',  Icon: IconSettings, end: false },
    ],
  },
];

function SidebarLink({ to, label, Icon, end, collapsed }) {
  const [hov, setHov] = useState(false);
  return (
    <NavLink
      to={to} end={end}
      title={collapsed ? label : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 10,
        padding: collapsed ? '9px 0' : '9px 12px',
        borderRadius: 8,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? '#0F172A' : hov ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)',
        background: isActive ? '#FFFFFF' : hov ? 'rgba(255,255,255,0.08)' : 'transparent',
        boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
        transition: 'background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease',
        whiteSpace: 'nowrap', overflow: 'hidden',
      })}
    >
      {({ isActive }) => (
        <>
          <span style={{
            color: isActive ? '#1E3A5F' : hov ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
            flexShrink: 0, transition: 'color 0.16s ease',
          }}>
            <Icon />
          </span>
          {/* Label fades and collapses width so the icon stays centred */}
          <span style={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : 'auto',
            overflow: 'hidden',
            transition: 'opacity 0.14s ease, width 0.22s ease',
            pointerEvents: 'none',
            flexShrink: 0,
          }}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [clinicName, setClinicName]   = useState('Your Clinic');
  const [clinicAbbr, setClinicAbbr]   = useState('');

  useEffect(() => {
    getSettings(token)
      .then(res => {
        const d = res.data?.data;
        if (!d) return;
        if (d.clinic_name) setClinicName(d.clinic_name);
        // Use saved abbreviation if set, otherwise derive from clinic_name
        setClinicAbbr(d.clinic_abbreviation || deriveAbbreviation(d.clinic_name) || '');
      })
      .catch(() => {});
  }, [token]);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const initials = ((user?.first_name ?? '').charAt(0) + (user?.last_name ?? '').charAt(0)).toUpperCase() || 'A';
  // Fallback if no abbreviation yet: first 2 letters of clinic name
  const displayAbbr = clinicAbbr || clinicName.slice(0, 2).toUpperCase();

  // Design token — one place to change the whole sidebar colour
  const SB = '#1E3A5F';

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: collapsed ? 64 : 220,
      zIndex: 50,
      background: SB,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.22s ease',
      overflow: 'hidden',
    }}>

      {/* Logo + toggle */}
      <div style={{
        padding: '14px 14px 12px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        minHeight: 56,
      }}>
        {/* Identity area — cross-fades between badge (collapsed) and wordmark (expanded) */}
        <div style={{ position: 'relative', flex: 1, minWidth: 0, height: 34, display: 'flex', alignItems: 'center' }}>
          {/* Collapsed badge */}
          <div style={{
            position: 'absolute',
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: '#FFFFFF',
            letterSpacing: '0.5px', userSelect: 'none',
            opacity: collapsed ? 1 : 0,
            transition: 'opacity 0.18s ease',
            pointerEvents: 'none',
          }}>
            {displayAbbr.slice(0, 3)}
          </div>
          {/* Expanded wordmark */}
          <div style={{
            position: 'absolute',
            lineHeight: 1,
            opacity: collapsed ? 0 : 1,
            transition: 'opacity 0.18s ease',
            pointerEvents: collapsed ? 'none' : 'auto',
            whiteSpace: 'nowrap',
          }}>
            <div>
              <span style={{ fontSize: 17, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.5px' }}>Pulse</span>
              <span style={{ fontSize: 17, fontWeight: 900, color: '#00B37E', letterSpacing: '-0.5px' }}>OS</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3, letterSpacing: '0.1px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
              {clinicName}
              {clinicAbbr && <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: 4 }}>· {clinicAbbr}</span>}
            </div>
          </div>
        </div>
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand' : 'Collapse'}
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '5px 6px',
            borderRadius: 7, display: 'flex', alignItems: 'center',
            transition: 'all 0.14s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
        >
          <IconToggle collapsed={collapsed} />
        </button>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 12px' }} />

      {/* Nav sections */}
      <nav style={{ flex: 1, padding: collapsed ? '10px 6px' : '10px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.9px', textTransform: 'uppercase',
              padding: '10px 12px 5px',
              opacity: collapsed ? 0 : 1,
              maxHeight: collapsed ? 0 : 32,
              overflow: 'hidden',
              transition: 'opacity 0.14s ease, max-height 0.22s ease',
            }}>
              {section.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {section.items.map(item => (
                <SidebarLink key={item.to} {...item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 12px' }} />

      {/* User footer */}
      <div style={{
        padding: collapsed ? '12px 0' : '12px 14px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 10,
      }}>
        {/* Avatar — always visible; tooltip shows full name when collapsed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: collapsed ? 'none' : 1 }}
          title={collapsed ? `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'User' : undefined}
        >
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.15)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#FFFFFF', userSelect: 'none',
          }}>
            {initials}
          </div>
          {/* Name + role — fade and collapse when sidebar is narrow */}
          <div style={{
            minWidth: 0,
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 120,
            overflow: 'hidden',
            transition: 'opacity 0.14s ease, max-width 0.22s ease',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize', marginTop: 1 }}>
              {user?.role ?? 'Administrator'}
            </div>
          </div>
        </div>
        {/* Logout — only shown when expanded; redundant when collapsed since the icon has no label */}
        {!collapsed && (
          <button
            onClick={handleLogout} title="Log out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', transition: 'color 0.14s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
          >
            <IconLogout />
          </button>
        )}
      </div>
    </aside>
  );
}
