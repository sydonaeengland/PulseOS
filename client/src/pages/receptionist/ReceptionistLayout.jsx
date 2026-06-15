import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ReceptionistSidebar from '../../components/receptionist/ReceptionistSidebar';
import NotificationBell from '../../components/receptionist/NotificationBell';

const SB_ACCENT = '#0EA5E9';
const SB        = '#0A2540';

function IconSearch() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
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

const ROUTE_LABELS = {
  '/receptionist':                       { breadcrumb: null,           title: 'Dashboard' },
  '/receptionist/appointments':          { breadcrumb: 'Front Desk',   title: 'Appointments' },
  '/receptionist/appointments/new':      { breadcrumb: 'Appointments', title: 'New Appointment' },
  '/receptionist/patients':              { breadcrumb: 'Front Desk',   title: 'Patients' },
  '/receptionist/patients/register':     { breadcrumb: 'Patients',     title: 'Register Patient' },
  '/receptionist/checkout':              { breadcrumb: 'Workflow',     title: 'Checkout' },
  '/receptionist/pending-registrations': { breadcrumb: 'Workflow',     title: 'Pending Registrations' },
  '/receptionist/my-schedule':           { breadcrumb: 'My Account',   title: 'My Schedule' },
  '/receptionist/test-results':          { breadcrumb: 'Workflow',     title: 'Upload Test Results' },
  '/receptionist/print-queue':           { breadcrumb: 'Workflow',     title: 'Print Queue' },
};

function usePageMeta(pathname) {
  if (/^\/receptionist\/patients\/\d+/.test(pathname)) {
    return { breadcrumb: 'Patients', title: 'Patient Profile' };
  }
  return ROUTE_LABELS[pathname] ?? { breadcrumb: null, title: 'Receptionist' };
}

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

function TopBar({ user, sidebarWidth }) {
  const { pathname } = useLocation();
  const { breadcrumb, title } = usePageMeta(pathname);
  const [searchFocused, setSearchFocused] = useState(false);
  const width = useWindowWidth();

  const initials = ((user?.first_name ?? '').charAt(0) + (user?.last_name ?? '').charAt(0)).toUpperCase() || 'RX';
  const isNarrow = width < 768;

  return (
    <header style={{
      height: 58, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isNarrow ? '0 16px' : '0 28px',
      background: '#FFFFFF',
      borderBottom: '1px solid #EDF2F7',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {breadcrumb && !isNarrow && (
          <>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>{breadcrumb}</span>
            <span style={{ color: '#CBD5E1', display: 'flex' }}><IconChevronRight /></span>
          </>
        )}
        <h1 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h1>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isNarrow ? 8 : 12 }}>

        {/* Search — hide on very small screens */}
        {!isNarrow && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: searchFocused ? '#FFFFFF' : '#F8FAFC',
            border: `1px solid ${searchFocused ? SB_ACCENT : '#E2E8F0'}`,
            borderRadius: 20, padding: '5px 12px',
            transition: 'all 0.14s', cursor: 'text',
            boxShadow: searchFocused ? `0 0 0 3px ${SB_ACCENT}20` : 'none',
          }}>
            <span style={{ color: searchFocused ? SB_ACCENT : '#94A3B8', display: 'flex', flexShrink: 0, transition: 'color 0.14s' }}>
              <IconSearch />
            </span>
            <input
              placeholder="Search patients, appointments…"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: '#0F172A', width: 190 }}
            />
            <span style={{
              fontSize: 9, fontWeight: 700, color: '#94A3B8',
              background: '#F1F5F9', border: '1px solid #E2E8F0',
              borderRadius: 4, padding: '1px 5px', letterSpacing: '0.3px', flexShrink: 0,
            }}>Ctrl K</span>
          </div>
        )}

        <div style={{ width: 1, height: 18, background: '#E2E8F0' }} />

        {/* Notification bell */}
        <NotificationBell />

        <div style={{ width: 1, height: 18, background: '#E2E8F0' }} />

        {/* User chip */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: isNarrow ? 6 : 9 }}>
            {!isNarrow && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                  {user.first_name} {user.last_name}
                </div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1, textTransform: 'capitalize' }}>
                  {user.role ?? 'Receptionist'}
                </div>
              </div>
            )}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: SB,
              border: `2px solid ${SB_ACCENT}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: SB_ACCENT,
              flexShrink: 0, userSelect: 'none',
            }}>
              {initials}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default function ReceptionistLayout() {
  const { user } = useAuth();
  const width = useWindowWidth();

  // Auto-collapse sidebar on small screens
  const [collapsed, setCollapsed] = useState(width < 1024);
  const sidebarWidth = collapsed ? 64 : 232;

  // Re-evaluate on resize
  useEffect(() => {
    if (width < 1024 && !collapsed) setCollapsed(true);
  }, [width]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <ReceptionistSidebar collapsed={collapsed} onToggle={() => setCollapsed(prev => !prev)} />
      <div style={{
        marginLeft: sidebarWidth,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)',
        minWidth: 0,
      }}>
        <TopBar user={user} sidebarWidth={sidebarWidth} />
        <main style={{
          flex: 1,
          overflow: 'hidden',
          background: '#F5F7FA',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
