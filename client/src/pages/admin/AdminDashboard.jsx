import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
  PieChart, Pie,
  AreaChart, Area,
} from 'recharts';
import TopBar from '../../components/admin/TopBar';
import StatCard from '../../components/admin/StatCard';
import { getPendingPatients } from '../../api/patients';
import { getSettings } from '../../api/settings';

// â”€â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const WEEK_THIS = [
  { day: 'Mon', cur: 12, prev: 9 },
  { day: 'Tue', cur: 18, prev: 14 },
  { day: 'Wed', cur: 15, prev: 20 },
  { day: 'Thu', cur: 22, prev: 17 },
  { day: 'Fri', cur: 19, prev: 23 },
  { day: 'Sat', cur: 8,  prev: 11 },
  { day: 'Sun', cur: 3,  prev: 6 },
];

const PIE_DATA = [
  { name: 'Consultation', value: 45, color: '#1B4F72' },
  { name: 'Follow-up',    value: 28, color: '#0EA5E9' },
  { name: 'Dressing',     value: 12, color: '#C9A84C' },
  { name: 'Walk-in',      value: 10, color: '#64748B' },
  { name: 'Other',        value: 5,  color: '#94A3B8' },
];
const PIE_TOTAL = PIE_DATA.reduce((s, d) => s + d.value, 0);

const AREA_DATA = (() => {
  const pts = []; let val = 820;
  for (let i = 0; i < 30; i++) {
    val = Math.min(847, val + Math.floor(Math.random() * 3) + (i % 5 === 0 ? 1 : 0));
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    pts.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: val });
  }
  return pts;
})();

const REGISTRATIONS = [
  { name: 'Marcia Williams',    phone: '876-422-0193', parish: 'Kingston',   by: 'R. Thompson', date: 'Jun 12', status: 'Active' },
  { name: 'Devon Brown',        phone: '876-531-7784', parish: 'St. Andrew', by: 'N. Fraser',   date: 'Jun 12', status: 'Pending' },
  { name: 'Kezia Campbell',     phone: '876-618-2250', parish: 'Kingston',   by: 'R. Thompson', date: 'Jun 11', status: 'Active' },
  { name: 'Omar Reid',          phone: '876-703-9945', parish: 'St. Andrew', by: 'Admin',       date: 'Jun 11', status: 'Active' },
  { name: 'Tanya-Marie Clarke', phone: '876-812-4401', parish: 'Kingston',   by: 'N. Fraser',   date: 'Jun 10', status: 'Pending' },
];

// â”€â”€â”€ Stat card icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function IcoPatients() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function IcoCalendar() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function IcoStaff() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IcoAlert() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

// â”€â”€â”€ Action icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function IcoUserPlus() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}
function IcoCheck() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IcoGear() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IcoList() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

// â”€â”€â”€ Panel shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Panel({ children, style = {} }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 14,
      border: '1px solid #EEF2F7',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function PanelHead({ title, sub, right }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', letterSpacing:'-0.1px', marginBottom:1 }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:'#94A3B8' }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// â”€â”€â”€ Chart tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Tip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1E3A5F', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: '0.4px', textTransform: 'uppercase' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color === '#E2E8F0' ? '#94A3B8' : '#0EA5E9', letterSpacing: '-0.3px' }}>
          {p.value} <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>{unit}</span>
          {payload.length > 1 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>{i === 0 ? 'this week' : 'last week'}</span>}
        </div>
      ))}
    </div>
  );
}

// â”€â”€â”€ Donut centre â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DonutLabel({ total }) {
  return (
    <div style={{
      position:'absolute', inset:0, pointerEvents:'none',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    }}>
      <div style={{ fontSize:22, fontWeight:800, color:'#0F172A', lineHeight:1, letterSpacing:'-1px' }}>{total}</div>
      <div style={{ fontSize:9, color:'#94A3B8', marginTop:3, letterSpacing:'0.8px', textTransform:'uppercase' }}>visits</div>
    </div>
  );
}

// â”€â”€â”€ Status badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Badge({ status }) {
  const ok = status === 'Active';
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.2px',
      color: ok ? '#059669' : '#D97706',
      background: ok ? '#ECFDF5' : '#FFFBEB',
      border: `1px solid ${ok ? '#A7F3D0' : '#FDE68A'}`,
      borderRadius: 20, padding: '2px 8px', display: 'inline-block',
    }}>
      {status}
    </span>
  );
}

// â”€â”€â”€ Avatar initials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Deterministic colour from name â€” gives each patient a consistent colour
const AVATAR_COLORS = ['#1B4F72','#0EA5E9','#C9A84C','#7C3AED','#DC2626','#0891B2'];
function nameColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function RowAvatar({ name }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const bg = nameColor(name);
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: `${bg}20`, border: `1px solid ${bg}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 800, color: bg, userSelect: 'none',
    }}>
      {initials}
    </div>
  );
}

// â”€â”€â”€ Action card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ActionCard({ Ico, label, desc, badge, to, tint, iconColor }) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => navigate(to)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? tint ?? '#F0F6FF' : '#FAFBFC',
        border: `1px solid ${hov ? (iconColor ?? '#1B4F72') + '40' : '#EEF2F7'}`,
        borderRadius: 12, padding: '13px 13px 11px',
        cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.14s',
        display: 'flex', flexDirection: 'column', gap: 6, position: 'relative',
        boxShadow: hov ? `0 4px 16px ${(iconColor ?? '#1B4F72')}18` : 'none',
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 9,
        background: hov ? `${iconColor ?? '#1B4F72'}18` : '#F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hov ? (iconColor ?? '#1B4F72') : '#94A3B8',
        transition: 'all 0.14s', flexShrink: 0,
      }}>
        <Ico />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{label}</div>
      <div style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.3 }}>{desc}</div>
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 9, fontWeight: 800, color: '#fff',
          background: '#0EA5E9', borderRadius: 20, padding: '1px 5px',
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// â”€â”€â”€ Pie legend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PieLegend({ data }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'5px 12px', justifyContent:'center', marginTop:10 }}>
      {data.map(d => (
        <div key={d.name} style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:7, height:7, borderRadius:2, background:d.color, flexShrink:0, display:'inline-block' }} />
          <span style={{ fontSize:10, color:'#64748B', fontWeight:500 }}>
            {d.name} <span style={{ color:'#CBD5E1' }}>{d.value}%</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// â”€â”€â”€ Chart legend row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ChartLegend() {
  return (
    <div style={{ display:'flex', gap:14, alignItems:'center' }}>
      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
        <span style={{ width:10, height:10, borderRadius:3, background:'#1B4F72', display:'inline-block' }} />
        <span style={{ fontSize:10, color:'#64748B', fontWeight:500 }}>This week</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
        <span style={{ width:10, height:10, borderRadius:3, background:'#E2E8F0', display:'inline-block' }} />
        <span style={{ fontSize:10, color:'#94A3B8', fontWeight:400 }}>Last week</span>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return width;
}

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isNarrow = width < 900;
  const [pendingCount, setPendingCount]   = useState(null);
  const [clinicSummary, setClinicSummary] = useState('');
  const [activeBar, setActiveBar]         = useState(null);
  const [hovRow, setHovRow]               = useState(null);

  useEffect(() => {
    getPendingPatients(token)
      .then(r => setPendingCount(r.data.data?.length ?? 0))
      .catch(() => setPendingCount(0));
  }, [token]);

  useEffect(() => {
    getSettings(token)
      .then(r => {
        const d = r.data?.data;
        if (!d) return;
        const p = [d.clinic_name, d.city, d.country].filter(Boolean);
        if (p.length) setClinicSummary(p.join(' Â· '));
      })
      .catch(() => {});
  }, [token]);

  const pendingValue = pendingCount === null ? 'â€¦' : String(pendingCount);
  const hasPending   = pendingCount > 0;

  // Bar chart: this week shows both series; last week shows only prev
  const barData = WEEK_THIS;

  return (
    <>
      <TopBar title="Dashboard" breadcrumb="Admin" user={user} />

      <main style={{ flex:1, overflowY:'auto', background:'#F0F4F8', padding:'18px 22px 32px' }}>

        {/* â”€â”€ Welcome banner â€” Pre Clinic style â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/*
          The full-width welcome card from Pre Clinic is the single biggest
          premium signal in the reference images. It makes the dashboard feel
          *personal* â€” your name is large, the date is prominent, and the clinic
          context is right there. Every generic dashboard skips this.
          We use #1E3A5F (sidebar colour) for consistency â€” the banner and
          sidebar share the same brand dark, grounding the layout.
        */}
        <div style={{
          background: '#1E3A5F',
          borderRadius: 14,
          padding: '20px 28px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circles â€” subtle depth */}
          <div style={{ position:'absolute', right:-30, top:-40, width:180, height:180, borderRadius:'50%', background:'rgba(0,179,126,0.06)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', right:60, bottom:-60, width:140, height:140, borderRadius:'50%', background:'rgba(27,79,114,0.12)', pointerEvents:'none' }} />

          <div style={{ position:'relative' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:4, letterSpacing:'0.3px' }}>
              {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
              {clinicSummary && <span> Â· {clinicSummary}</span>}
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:'#FFFFFF', letterSpacing:'-0.5px', lineHeight:1.2 }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.first_name ?? 'Admin'}.
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:5 }}>
              Here's what's happening at your clinic today.
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/patients')}
            style={{
              background: '#0EA5E9', color: '#FFFFFF',
              border: 'none', borderRadius: 10,
              padding: '10px 20px', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              boxShadow: '0 4px 14px rgba(0,179,126,0.4)',
              transition: 'box-shadow 0.14s',
              position: 'relative',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,179,126,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,179,126,0.4)'; }}
          >
            View patients â†’
          </button>
        </div>

        {/* â”€â”€ Stat cards â€” Helanthus tinted style â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/*
          Each card has:
          1. A unique tint background â€” differentiates cards without being garish
          2. A coloured icon bubble top-left â€” gives instant visual identity
          3. A trend delta badge â€” â†‘ 8% communicates direction without reading numbers
          4. Sparklines â€” 7-day trend shape in the top-right corner

          The tints are desaturated versions of the brand colours so they don't
          fight each other. Blue (#EFF6FF), teal (#F0FDF9), amber (#FFFBEB),
          rose (#FFF1F2) â€” each card is a different colour family.
        */}
        <div style={{ display:'grid', gridTemplateColumns: isNarrow ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:12, marginBottom:14 }}>
          <StatCard
            label="Total patients" value="847"
            subtitle="vs last week" delta="8%" deltaUp
            sparkline={[12,8,15,11,19,14,8]} sparklineType="line"
            tint="#EFF6FF" Icon={IcoPatients} iconColor="#1B4F72" sparklineColor="#1B4F72"
          />
          <StatCard
            label="Appointments today" value="24"
            subtitle="vs yesterday" delta="12%" deltaUp
            sparkline={[18,24,20,28,22,15,24]} sparklineType="bar"
            tint="#EFF8FF" Icon={IcoCalendar} iconColor="#0EA5E9" sparklineColor="#0EA5E9"
          />
          <StatCard
            label="Staff on duty" value="6"
            subtitle="All accounts active"
            sparkline={[6,6,6,6,6,6,6]} sparklineType="line"
            tint="#FFFBEB" Icon={IcoStaff} iconColor="#C9A84C" sparklineColor="#C9A84C"
          />
          {!hasPending && pendingCount !== null ? (
            <StatCard
              label="Pending review"
              Icon={IcoAlert}
              allClear
            />
          ) : (
            <StatCard
              label="Pending review" value={pendingValue}
              subtitle="Needs attention"
              accentColor="#D97706"
              tint="#FFF7ED"
              Icon={IcoAlert} iconColor="#D97706"
              pulseDot={hasPending} pulseDotColor="#F59E0B"
            />
          )}
        </div>

        {/* â”€â”€ Charts row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ display:'grid', gridTemplateColumns: isNarrow ? '1fr' : '60fr 40fr', gap:12, marginBottom:12 }}>

          {/* Bar chart â€” overlapping this/last week */}
          {/*
            Instead of a toggle that swaps data, we show both weeks simultaneously
            as overlapping bar groups â€” this week (navy) in front, last week (light
            grey) behind. This is the MedCore pattern: direct visual comparison
            without switching views.

            barCategoryGap="20%" controls the gap between day groups.
            barGap={-barSize} would overlap bars; here we use separate <Bar>
            components and recharts automatically groups them side by side.
            We use barSize={14} so both bars fit comfortably in each day slot.
          */}
          <Panel style={{ padding:'16px 18px' }}>
            <PanelHead
              title="Appointments"
              sub="This week vs last week"
              right={<ChartLegend />}
            />
            <ResponsiveContainer width="100%" height={185}>
              <BarChart
                data={barData} barSize={12} barGap={2}
                margin={{ top:4, right:4, left:-20, bottom:0 }}
                onMouseLeave={() => setActiveBar(null)}
              >
                <CartesianGrid horizontal vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize:11, fill:'#94A3B8' }} />
                <YAxis domain={[0,30]} tickCount={4} axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#CBD5E1' }} width={24} />
                <Tooltip content={<Tip unit="appts" />} cursor={{ fill:'rgba(15,23,42,0.02)' }} />
                {/* Last week â€” light grey, rendered first so it's behind */}
                <Bar dataKey="prev" radius={[3,3,0,0]} fill="#E2E8F0" />
                {/* This week â€” navy, rendered second so it's in front */}
                <Bar dataKey="cur" radius={[3,3,0,0]} onMouseEnter={(_, i) => setActiveBar(i)}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={activeBar === i ? '#0EA5E9' : '#1B4F72'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          {/* Donut */}
          <Panel style={{ padding:'16px 18px' }}>
            <PanelHead title="Visit types" sub="By appointment category" />
            <div style={{ position:'relative', height:185 }}>
              <ResponsiveContainer width="100%" height={185}>
                <PieChart>
                  <Pie
                    data={PIE_DATA} cx="50%" cy="50%"
                    innerRadius={56} outerRadius={82}
                    paddingAngle={3} dataKey="value"
                    startAngle={90} endAngle={-270} strokeWidth={0}
                  >
                    {PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [`${v}%`, n]}
                    contentStyle={{ background:'#1E3A5F', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, fontSize:11, color:'#E2E8F0', boxShadow:'0 8px 24px rgba(0,0,0,0.22)' }}
                    itemStyle={{ color:'#94A3B8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <DonutLabel total={PIE_TOTAL} />
            </div>
            <PieLegend data={PIE_DATA} />
          </Panel>
        </div>

        {/* â”€â”€ Area chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Panel style={{ padding:'16px 18px', marginBottom:12 }}>
          <PanelHead title="Patient registrations â€” last 30 days" sub="Cumulative total" />
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={AREA_DATA} margin={{ top:4, right:4, left:-20, bottom:0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#0EA5E9" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#CBD5E1' }} interval={4} />
              <YAxis domain={[815,850]} tickCount={3} axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#CBD5E1' }} width={28} />
              <Tooltip content={<Tip unit="patients" />} cursor={{ stroke:'rgba(0,179,126,0.25)', strokeWidth:1 }} />
              <Area dataKey="value" stroke="#0EA5E9" strokeWidth={1.75} fill="url(#areaGrad)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        {/* â”€â”€ Table + Quick actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ display:'grid', gridTemplateColumns: isNarrow ? '1fr' : '65fr 35fr', gap:12 }}>

          {/* Table â€” with row avatars like Helanthus/Medioverse */}
          {/*
            Row avatars (initials circles) add the single biggest premium signal
            to a data table. They break the monotony of text rows and make each
            entry feel like a real person rather than a record. We use a
            deterministic colour hash so the same patient always gets the same
            colour â€” this is the same technique Slack, Linear, and Notion use.
          */}
          <Panel style={{ overflow:'hidden' }}>
            <div style={{ padding:'14px 18px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:2 }}>Recent registrations</div>
                <div style={{ fontSize:11, color:'#94A3B8' }}>Latest patients added to the system</div>
              </div>
              <button
                onClick={() => navigate('/admin/patients')}
                style={{ fontSize:11, fontWeight:700, color:'#1B4F72', background:'none', border:'none', cursor:'pointer' }}
              >
                View all â†’
              </button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderTop:'1px solid #F1F5F9' }}>
                  {['Patient','Phone','Parish','Registered by','Date','Status'].map(h => (
                    <th key={h} style={{ fontSize:9, fontWeight:700, color:'#CBD5E1', textTransform:'uppercase', letterSpacing:'0.6px', padding:'7px 12px', textAlign:'left', background:'#FAFBFC', borderBottom:'1px solid #F1F5F9' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGISTRATIONS.map((r, i) => (
                  <tr
                    key={i}
                    onMouseEnter={() => setHovRow(i)}
                    onMouseLeave={() => setHovRow(null)}
                    style={{ background: hovRow === i ? '#F0F4F8' : '#FFFFFF', transition:'background 0.1s', borderBottom:'1px solid #F8FAFC' }}
                  >
                    <td style={{ padding:'8px 12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <RowAvatar name={r.name} />
                        <span style={{ fontSize:12, fontWeight:600, color:'#0F172A' }}>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'8px 12px', fontSize:11, color:'#64748B', fontFamily:'monospace', letterSpacing:'-0.2px' }}>{r.phone}</td>
                    <td style={{ padding:'8px 12px', fontSize:11, color:'#64748B' }}>{r.parish}</td>
                    <td style={{ padding:'8px 12px', fontSize:11, color:'#64748B' }}>{r.by}</td>
                    <td style={{ padding:'8px 12px', fontSize:11, color:'#94A3B8' }}>{r.date}</td>
                    <td style={{ padding:'8px 12px' }}><Badge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {/* Quick actions â€” tinted hover per action */}
          <Panel style={{ padding:'14px 13px 12px' }}>
            <PanelHead title="Quick actions" sub="Common admin tasks" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <ActionCard Ico={IcoUserPlus} label="Create staff"    desc="Add a system user"     to="/admin/staff"      tint="#EFF6FF" iconColor="#1B4F72" />
              <ActionCard Ico={IcoCheck}    label="Review patients" desc="Approve registrations"  to="/admin/patients"   tint="#F0FDF9" iconColor="#0EA5E9" badge={pendingCount ?? 0} />
              <ActionCard Ico={IcoGear}     label="Settings"        desc="Clinic & documents"    to="/admin/settings"   tint="#FFFBEB" iconColor="#C9A84C" />
              <ActionCard Ico={IcoList}     label="Audit log"       desc="Full activity history"  to="/admin/audit-log"  tint="#FFF1F2" iconColor="#DC2626" />
            </div>
          </Panel>

        </div>
      </main>
    </>
  );
}
