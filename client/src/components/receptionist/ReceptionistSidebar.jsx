import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── Design tokens ────────────────────────────────────────────────────
const SB        = '#0A2540';   // deep teal-navy
const SB_LIGHT  = '#0D2E4E';   // hover surface
const SB_ACTIVE = '#FFFFFF';
const SB_ACCENT = '#0EA5E9';   // bright sky blue / teal

// ─── Icons ────────────────────────────────────────────────────────────

function IconHome() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function IconPatients() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function IconCash() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
function IconPrint() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm1-4h.01" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

const NAV_SECTIONS = [
  {
    label: 'Front Desk',
    items: [
      { to: '/receptionist',               label: 'Dashboard',    Icon: IconHome,      end: true },
      { to: '/receptionist/appointments',  label: 'Appointments', Icon: IconCalendar,  end: false },
      { to: '/receptionist/patients',      label: 'Patients',     Icon: IconPatients,  end: false },
    ],
  },
  {
    label: 'Workflow',
    items: [
      { to: '/receptionist/checkout',              label: 'Checkout',      Icon: IconCash,      end: false },
      { to: '/receptionist/pending-registrations', label: 'Pending Reg.',  Icon: IconClipboard, end: false },
      { to: '/receptionist/test-results',          label: 'Test Results',  Icon: IconUpload,    end: false },
      { to: '/receptionist/print-queue',           label: 'Print Queue',   Icon: IconPrint,     end: false },
    ],
  },
  {
    label: 'My Account',
    items: [
      { to: '/receptionist/my-schedule', label: 'My Schedule', Icon: IconClock, end: false },
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
        padding: collapsed ? '10px 0' : '9px 12px',
        borderRadius: 10,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? SB : hov ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
        background: isActive
          ? SB_ACTIVE
          : hov
          ? 'rgba(255,255,255,0.08)'
          : 'transparent',
        boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
        transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        position: 'relative',
      })}
    >
      {({ isActive }) => (
        <>
          {/* Active left accent bar */}
          {isActive && !collapsed && (
            <span style={{
              position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
              width: 3, height: 16, borderRadius: 2,
              background: SB_ACCENT,
            }} />
          )}
          <span style={{
            color: isActive ? SB_ACCENT : hov ? SB_ACCENT : 'rgba(255,255,255,0.4)',
            flexShrink: 0,
            display: 'flex', alignItems: 'center',
            transition: 'color 0.15s',
          }}>
            <Icon />
          </span>
          <span style={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : 'auto',
            maxWidth: collapsed ? 0 : 200,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.14s ease, width 0.22s ease, max-width 0.22s ease',
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

// ─── Logout modal ─────────────────────────────────────────────────────

function LogoutModal({ onConfirm, onCancel, user }) {
  const [signingOut, setSigningOut] = useState(false);

  const handleConfirm = () => {
    setSigningOut(true);
    setTimeout(() => { onConfirm(); }, 1400);
  };

  if (signingOut) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: SB,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 18,
        animation: 'fadeInFull 0.3s ease',
      }}>
        <style>{`@keyframes fadeInFull { from { opacity:0 } to { opacity:1 } } @keyframes spin { to { transform:rotate(360deg) } }`}</style>
        <div style={{
          width: 40, height: 40, border: `3px solid ${SB_ACCENT}40`,
          borderTopColor: SB_ACCENT, borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}/>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.2px' }}>Signing you out…</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Clearing your session</div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(10,37,64,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: 20, padding: '36px 32px', width: 340,
        boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: '50%',
          background: '#EFF8FF', border: '2px solid #BAE6FD',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 800, color: SB_ACCENT,
          margin: '0 auto 18px', userSelect: 'none',
        }}>
          {((user?.first_name ?? '').charAt(0) + (user?.last_name ?? '').charAt(0)).toUpperCase() || 'RX'}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.3px' }}>Sign out?</div>
        <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 28 }}>
          You'll be signed out of your<br />front desk session.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; }}
          >
            Stay
          </button>
          <button
            onClick={handleConfirm}
            style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: SB, color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0D2E4E'; }}
            onMouseLeave={e => { e.currentTarget.style.background = SB; }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────

export default function ReceptionistSidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const doLogout = () => { logout(); navigate('/login', { replace: true }); };
  const initials = ((user?.first_name ?? '').charAt(0) + (user?.last_name ?? '').charAt(0)).toUpperCase() || 'RX';

  return (
    <>
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: collapsed ? 64 : 232,
        zIndex: 50,
        background: SB,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}>

        {/* ── Logo + toggle row ── */}
        <div style={{
          height: 60,
          display: 'flex', alignItems: 'center',
          padding: '0 14px',
          flexShrink: 0,
          gap: 10,
        }}>
          {/* When collapsed: just the toggle centred, no logo competing for space */}
          {collapsed ? (
            <button
              onClick={onToggle}
              title="Expand sidebar"
              style={{
                width: 36, height: 36, margin: '0 auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${SB_ACCENT}18`,
                border: `1px solid ${SB_ACCENT}33`,
                borderRadius: 10,
                cursor: 'pointer',
                color: SB_ACCENT,
                transition: 'all 0.14s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${SB_ACCENT}30`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${SB_ACCENT}18`; }}
            >
              <IconChevronRight />
            </button>
          ) : (
            <>
              {/* Wordmark */}
              <div style={{ flex: 1, minWidth: 0, lineHeight: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  PulseOS
                </div>
                <div style={{ fontSize: 10, color: SB_ACCENT, fontWeight: 700, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Seymour Doctors &amp; Associates
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>Front Desk</div>
              </div>
              {/* Collapse toggle */}
              <button
                onClick={onToggle}
                title="Collapse sidebar"
                style={{
                  flexShrink: 0,
                  width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 7,
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.35)',
                  transition: 'all 0.14s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
              >
                <IconMenu />
              </button>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 12px', flexShrink: 0 }} />

        {/* ── Nav ── */}
        <style>{'.sb-nav::-webkit-scrollbar{display:none}'}</style>
        <nav className="sb-nav" style={{
          flex: 1,
          padding: collapsed ? '12px 8px' : '12px 10px',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          display: 'flex', flexDirection: 'column',
        }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label} style={{ marginBottom: 8 }}>
              {/* Section label */}
              <div style={{
                fontSize: 9, fontWeight: 700,
                color: 'rgba(255,255,255,0.2)',
                letterSpacing: '1.2px', textTransform: 'uppercase',
                padding: '10px 12px 5px',
                opacity: collapsed ? 0 : 1,
                maxHeight: collapsed ? 0 : 32,
                overflow: 'hidden',
                transition: 'opacity 0.14s ease, max-height 0.22s ease',
                pointerEvents: 'none',
              }}>
                {section.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.items.map(item => (
                  <SidebarLink key={item.to} {...item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 12px', flexShrink: 0 }} />

        {/* ── User footer ── */}
        <div style={{
          padding: collapsed ? '12px 0' : '12px 14px',
          flexShrink: 0,
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8,
        }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: collapsed ? 'none' : 1 }}
            title={collapsed ? `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'User' : undefined}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: `${SB_ACCENT}22`,
              border: `1.5px solid ${SB_ACCENT}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: SB_ACCENT,
              userSelect: 'none',
            }}>
              {initials}
            </div>
            <div style={{
              minWidth: 0,
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : 130,
              overflow: 'hidden',
              transition: 'opacity 0.14s ease, max-width 0.22s ease',
              pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.first_name} {user?.last_name}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize', marginTop: 1 }}>
                {user?.role ?? 'Receptionist'}
              </div>
            </div>
          </div>

          {!collapsed && (
            <button
              onClick={() => setShowLogoutModal(true)}
              title="Sign out"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', padding: '5px',
                borderRadius: 7, flexShrink: 0,
                display: 'flex', alignItems: 'center',
                transition: 'color 0.14s, background 0.14s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FF6B6B'; e.currentTarget.style.background = 'rgba(255,107,107,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'none'; }}
            >
              <IconLogout />
            </button>
          )}
        </div>
      </aside>

      {showLogoutModal && (
        <LogoutModal user={user} onConfirm={doLogout} onCancel={() => setShowLogoutModal(false)} />
      )}
    </>
  );
}
