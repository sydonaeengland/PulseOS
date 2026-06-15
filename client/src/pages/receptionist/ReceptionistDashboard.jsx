import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTodayStats, getTodayAppointments, checkinAppointment } from '../../api/appointments';
import { getCheckoutQueue } from '../../api/checkout';
import { getPendingPatients } from '../../api/patients';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const ACCENT = '#0EA5E9';
const DARK   = '#0A2540';

// ─── Icons ────────────────────────────────────────────────────────
function IcoCal()    { return <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function IcoCheck()  { return <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function IcoCash()   { return <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>; }
function IcoClip()   { return <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>; }
function IcoUser()   { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
function IcoPlus()   { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>; }
function IcoArrow()  { return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>; }
function IcoCheckin(){ return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>; }

// ─── Status styles ────────────────────────────────────────────────
const STATUS_STYLES = {
  scheduled:  { bg: '#EFF8FF', border: '#BAE6FD', color: '#0369A1', label: 'Scheduled',  dot: ACCENT },
  checked_in: { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D', label: 'Checked In', dot: '#22C55E' },
  triage:     { bg: '#FEF3C7', border: '#FDE68A', color: '#92400E', label: 'Checked In', dot: '#F59E0B' },
  waiting:    { bg: '#EDE9FE', border: '#DDD6FE', color: '#5B21B6', label: 'Waiting',    dot: '#8B5CF6' },
  completed:  { bg: '#F8FAFC', border: '#E2E8F0', color: '#64748B', label: 'Completed',  dot: '#94A3B8' },
  cancelled:  { bg: '#FFF1F2', border: '#FECDD3', color: '#E11D48', label: 'Cancelled',  dot: '#F43F5E' },
  no_show:    { bg: '#FFF7ED', border: '#FED7AA', color: '#D97706', label: 'No Show',    dot: '#F59E0B' },
};

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

// ─── Stat card ────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent, onClick, loading }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${hov && onClick ? accent + '55' : '#E8EFF8'}`,
        borderRadius: 14, padding: '16px 18px',
        flex: 1, minWidth: 0, cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.16s ease',
        boxShadow: hov && onClick ? `0 6px 20px ${accent}16` : '0 1px 4px rgba(0,0,0,0.04)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: '14px 14px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: accent + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
          {icon}
        </div>
        {onClick && <span style={{ color: hov ? accent : '#CBD5E1', transition: 'color 0.14s', marginTop: 2 }}><IcoArrow /></span>}
      </div>
      {loading ? (
        <div style={{ height: 28, borderRadius: 7, background: '#F1F5F9', marginBottom: 5 }} />
      ) : (
        <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1, letterSpacing: '-1px' }}>
          {value ?? <span style={{ color: '#CBD5E1', fontWeight: 400, fontSize: 18 }}>—</span>}
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Mini donut ───────────────────────────────────────────────────
function MiniDonut({ pct, size = 52, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ACCENT} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
    </svg>
  );
}

// ─── Quick action ─────────────────────────────────────────────────
function QuickAction({ label, icon, accent, description, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1px solid ${hov ? accent + '45' : '#E8EFF8'}`, background: hov ? accent + '08' : '#FAFBFC', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.14s', boxShadow: hov ? `0 3px 10px ${accent}12` : 'none' }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: hov ? accent + '18' : accent + '10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, transition: 'transform 0.14s', transform: hov ? 'scale(1.08)' : 'scale(1)' }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{label}</div>
        {description && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>{description}</div>}
      </div>
      <span style={{ color: hov ? accent : '#CBD5E1', flexShrink: 0, transition: 'color 0.14s' }}><IcoArrow /></span>
    </button>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────
const AV_COLORS = ['#0EA5E9', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];
function nameColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AV_COLORS[Math.abs(h) % AV_COLORS.length];
}
function PatientAvatar({ name, size = 28 }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const bg = nameColor(name);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: bg + '20', border: `1.5px solid ${bg}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.floor(size * 0.33), fontWeight: 800, color: bg, userSelect: 'none' }}>
      {initials}
    </div>
  );
}

// ─── Mini calendar ────────────────────────────────────────────────
function MiniCalendar({ onSelectDate }) {
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  // Local-time today string
  const ty = today.getFullYear();
  const tm = String(today.getMonth() + 1).padStart(2, '0');
  const td = String(today.getDate()).padStart(2, '0');
  const todayStr = `${ty}-${tm}-${td}`;

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDow    = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;

  const cells = Array.from({ length: startOffset + daysInMonth }, (_, i) => {
    if (i < startOffset) return null;
    const day = i - startOffset + 1;
    const d = new Date(month.getFullYear(), month.getMonth(), day);
    const y2 = d.getFullYear(), m2 = String(d.getMonth() + 1).padStart(2, '0'), d2 = String(d.getDate()).padStart(2, '0');
    return `${y2}-${m2}-${d2}`;
  });

  const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const monthLabel = month.toLocaleDateString('en-JM', { month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: '12px 14px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px 4px', borderRadius: 5 }}
          onMouseEnter={e => { e.currentTarget.style.color = DARK; }} onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; }}>
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{monthLabel}</span>
        <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px 4px', borderRadius: 5 }}
          onMouseEnter={e => { e.currentTarget.style.color = DARK; }} onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; }}>
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 3 }}>
        {DAYS.map(d => <div key={d} style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textAlign: 'center' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const isToday = d === todayStr;
          const isPast  = d < todayStr;
          return (
            <button key={d} onClick={() => onSelectDate(d)}
              style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: isToday ? ACCENT : 'transparent', color: isToday ? '#FFF' : isPast ? '#CBD5E1' : '#0F172A', fontSize: 10, fontWeight: isToday ? 800 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', transition: 'background 0.1s' }}
              onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = ACCENT + '18'; }}
              onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'transparent'; }}>
              {new Date(d + 'T00:00:00').getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
export default function ReceptionistDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]             = useState(null);
  const [appointments, setAppts]      = useState([]);
  const [checkoutQueue, setQueue]     = useState([]);
  const [pendingReg, setPending]      = useState([]);
  const [loading, setLoading]         = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(null); // appt id being checked in

  const load = () => {
    if (!token) return;
    Promise.all([
      getTodayStats(token).catch(() => null),
      getTodayAppointments(token).catch(() => null),
      getCheckoutQueue(token).catch(() => null),
      getPendingPatients(token).catch(() => null),
    ]).then(([s, a, c, p]) => {
      if (s?.data?.data?.stats)        setStats(s.data.data.stats);
      if (a?.data?.data?.appointments) setAppts(a.data.data.appointments);
      if (c?.data?.data?.queue)        setQueue(c.data.data.queue);
      if (p?.data?.data)               setPending(p.data.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [token]);

  const handleCheckin = async (apptId, e) => {
    e.stopPropagation();
    setCheckinLoading(apptId);
    try {
      await checkinAppointment(apptId, token);
      load();
    } catch { setCheckinLoading(null); }
  };

  const now      = new Date();
  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayLabel = now.toLocaleDateString('en-JM', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const total     = stats?.total    ?? 0;
  const checkedIn = stats?.checked_in ?? 0;
  const completed = stats?.completed  ?? 0;
  const cancelled = stats?.cancelled  ?? 0;
  const scheduled = stats?.scheduled  ?? 0;
  const donePct   = total > 0 ? completed / total : 0;

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const apptMins = a => { const [h,m] = (a.appointment_time ?? '00:00').split(':'); return parseInt(h)*60+parseInt(m); };
  const isOverdue = a => a.status === 'scheduled' && apptMins(a) + (a.duration_minutes ?? 15) < nowMins;

  const upcomingAppts = appointments
    .filter(a => ['scheduled','checked_in','triage','waiting'].includes(a.status))
    .sort((a,b) => apptMins(a) - apptMins(b))
    .slice(0, 10);

  const inClinicList = appointments
    .filter(a => ['checked_in','triage','waiting'].includes(a.status))
    .slice(0, 4);

  // ─ Hourly bar data (7am–6pm)
  const hourBuckets = Array.from({ length: 11 }, (_, i) => {
    const h = 7 + i;
    const label = `${h % 12 || 12}${h >= 12 ? 'p' : 'a'}`;
    const count = appointments.filter(a => a.appointment_time && parseInt(a.appointment_time.split(':')[0], 10) === h).length;
    return { label, count };
  });

  // ─ Visit type pie
  const PIE_COLORS = ['#0EA5E9','#10B981','#8B5CF6','#F59E0B','#EF4444','#06B6D4'];
  const visitTypeCounts = appointments.reduce((acc, a) => { const k = a.visit_type ?? 'General'; acc[k] = (acc[k] ?? 0) + 1; return acc; }, {});
  const pieData = Object.entries(visitTypeCounts).sort((a,b) => b[1]-a[1]).slice(0,6).map(([name,value],i) => ({ name, value, color: PIE_COLORS[i] }));

  // ─ Status breakdown bar data (only non-zero)
  const statusBreakdown = [
    { label: 'Done',      value: completed, color: '#10B981' },
    { label: 'Checked In',value: checkedIn, color: ACCENT },
    { label: 'Triage',    value: appointments.filter(a=>a.status==='triage').length, color: '#F59E0B' },
    { label: 'Waiting',   value: appointments.filter(a=>a.status==='waiting').length, color: '#8B5CF6' },
    { label: 'Scheduled', value: scheduled, color: '#94A3B8' },
    { label: 'Cancelled', value: cancelled, color: '#F43F5E' },
  ].filter(s => s.value > 0);

  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div style={{ padding: '20px 24px', maxWidth: 1440, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* ── Welcome banner ── */}
        <div style={{ background: DARK, borderRadius: 18, padding: '22px 26px', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', border: `40px solid ${ACCENT}14`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, right: 110, width: 110, height: 110, borderRadius: '50%', border: `22px solid ${ACCENT}0A`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: `${ACCENT}BB`, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 6 }}>{todayLabel}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', letterSpacing: '-0.4px', marginBottom: 5 }}>{greeting}, {user?.first_name ?? 'there'}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                {loading ? 'Loading today\'s schedule…' : total === 0 ? 'No appointments today.' : `${total} appointments · ${checkedIn} checked in · ${completed} completed · ${checkoutQueue.length} awaiting checkout`}
              </div>
            </div>
            {!loading && total > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 18px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ position: 'relative', width: 52, height: 52 }}>
                  <MiniDonut pct={donePct} size={52} stroke={5} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#FFF' }}>{Math.round(donePct * 100)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF', lineHeight: 1 }}>Today's progress</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{completed} of {total} complete</div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, background: `${ACCENT}25`, color: ACCENT, borderRadius: 20, padding: '2px 7px' }}>{scheduled} scheduled</span>
                    <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: '2px 7px' }}>{checkedIn} in</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          <StatCard icon={<IcoCal />}   label="Total Today"      value={loading ? null : total}               sub={`${scheduled} still scheduled`}      accent={ACCENT}    onClick={() => navigate('/receptionist/appointments')} loading={loading} />
          <StatCard icon={<IcoCheck />} label="Checked In"       value={loading ? null : checkedIn}          sub={`${completed} completed`}             accent="#10B981"   onClick={() => navigate('/receptionist/appointments')} loading={loading} />
          <StatCard icon={<IcoCash />}  label="Awaiting Checkout" value={loading ? null : checkoutQueue.length} sub={`${checkoutQueue.length} visit${checkoutQueue.length!==1?'s':''} ready`} accent="#F59E0B" onClick={() => navigate('/receptionist/checkout')} loading={loading} />
          <StatCard icon={<IcoClip />}  label="Pending Review"   value={loading ? null : pendingReg.length}  sub="Self-registrations"                   accent="#8B5CF6"   onClick={() => navigate('/receptionist/pending-registrations')} loading={loading} />
        </div>

        {/* ── Main grid: left wide / right sidebar ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 286px', gap: 14 }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Upcoming appointments — with check-in button */}
            <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E8EFF8', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Upcoming Appointments</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>Active for today — click a row to open calendar</div>
                </div>
                <button onClick={() => navigate('/receptionist/appointments')}
                  style={{ fontSize: 11, fontWeight: 700, color: ACCENT, background: '#EFF8FF', border: 'none', cursor: 'pointer', padding: '5px 12px', borderRadius: 7 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#DBEFFE'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#EFF8FF'; }}>
                  View calendar
                </button>
              </div>

              {loading ? (
                <div style={{ padding: '28px 18px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>Loading…</div>
              ) : upcomingAppts.length === 0 ? (
                <div style={{ padding: '40px 18px', textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EFF8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: ACCENT }}><IcoCal /></div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>No upcoming appointments</div>
                </div>
              ) : upcomingAppts.map((appt, i) => {
                const overdue = isOverdue(appt);
                const canCheckIn = appt.status === 'scheduled';
                const s = overdue
                  ? { bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C', label: 'Overdue', dot: '#F97316' }
                  : STATUS_STYLES[appt.status] ?? STATUS_STYLES.scheduled;
                const mid  = appt.patient_middle_name ? ` ${appt.patient_middle_name}` : '';
                const name = `${appt.patient_first_name}${mid} ${appt.patient_last_name}`;
                const isCheckingIn = checkinLoading === appt.id;
                return (
                  <div key={appt.id}
                    onClick={() => navigate('/receptionist/appointments')}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: i < upcomingAppts.length - 1 ? '1px solid #F8FAFC' : 'none', background: overdue ? '#FFFBF5' : 'transparent', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = overdue ? '#FEF3E2' : '#FAFBFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = overdue ? '#FFFBF5' : 'transparent'; }}>
                    <PatientAvatar name={name} size={28} />
                    <div style={{ minWidth: 52, flexShrink: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: overdue ? '#C2410C' : ACCENT }}>{formatTime(appt.appointment_time)}</div>
                      {overdue && <div style={{ fontSize: 9, fontWeight: 700, color: '#F97316' }}>Not checked in</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>Dr. {appt.doctor_last_name} · {appt.visit_type ?? 'General'}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>{s.label}</span>
                    {canCheckIn && (
                      <button
                        onClick={e => handleCheckin(appt.id, e)}
                        disabled={isCheckingIn}
                        title="Check in patient"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, background: 'transparent', border: '1px solid #BBF7D0', color: '#15803D', fontSize: 11, fontWeight: 700, cursor: isCheckingIn ? 'default' : 'pointer', flexShrink: 0, opacity: isCheckingIn ? 0.55 : 1, transition: 'all 0.12s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { if (!isCheckingIn) { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.borderColor = '#86EFAC'; } }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#BBF7D0'; }}>
                        {isCheckingIn
                          ? <div style={{ width: 8, height: 8, border: '1.5px solid #15803D', borderTopColor: 'transparent', borderRadius: '50%' }} />
                          : <IcoCheckin />}
                        Check in
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Currently in clinic */}
            {!loading && inClinicList.length > 0 && (
              <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #BBF7D0', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #F0FDF4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>In Clinic Now</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 20, padding: '2px 8px' }}>{inClinicList.length} patient{inClinicList.length !== 1 ? 's' : ''}</span>
                </div>
                {inClinicList.map((appt, i) => {
                  const mid  = appt.patient_middle_name ? ` ${appt.patient_middle_name}` : '';
                  const name = `${appt.patient_first_name}${mid} ${appt.patient_last_name}`;
                  const s    = STATUS_STYLES[appt.status] ?? STATUS_STYLES.checked_in;
                  return (
                    <div key={appt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', borderBottom: i < inClinicList.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <PatientAvatar name={name} size={26} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{name}</div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>Dr. {appt.doctor_last_name} · {formatTime(appt.appointment_time)}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 20, padding: '2px 8px' }}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Charts row — only show when there's data */}
            {!loading && appointments.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                {/* Hourly volume */}
                <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E8EFF8', padding: '16px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>Volume by Hour</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 12 }}>Appointments per hour slot</div>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={hourBuckets} margin={{ top: 0, right: 0, left: -28, bottom: 0 }} barSize={12}>
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: DARK, border: 'none', borderRadius: 7, fontSize: 11, color: '#FFF', padding: '5px 10px' }} cursor={{ fill: '#F1F5F9' }} formatter={v => [v, 'appointments']} />
                      <Bar dataKey="count" fill={ACCENT} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Status breakdown */}
                <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E8EFF8', padding: '16px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>Today's Breakdown</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 12 }}>Appointments by status</div>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={statusBreakdown} layout="vertical" margin={{ top: 0, right: 10, left: 50, bottom: 0 }} barSize={9}>
                      <XAxis type="number" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} width={50} />
                      <Tooltip contentStyle={{ background: DARK, border: 'none', borderRadius: 7, fontSize: 11, color: '#FFF', padding: '5px 10px' }} cursor={{ fill: '#F8FAFC' }} formatter={v => [v, 'patients']} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Visit types chart — only when there are multiple types */}
            {!loading && pieData.length > 1 && (
              <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E8EFF8', padding: '16px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>Visit Types</div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 12 }}>Today's appointment mix</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <ResponsiveContainer width={130} height={130}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={34} outerRadius={54} dataKey="value" paddingAngle={2} strokeWidth={0}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: DARK, border: 'none', borderRadius: 7, fontSize: 11, color: '#FFF', padding: '5px 10px' }} formatter={(v, name) => [v, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', flex: 1 }}>
                    {pieData.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: '#64748B' }}>{d.name} <strong style={{ color: '#0F172A' }}>{d.value}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Mini calendar */}
            <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E8EFF8', overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Calendar</div>
                <button onClick={() => navigate('/receptionist/appointments')}
                  style={{ fontSize: 10, fontWeight: 600, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Open
                </button>
              </div>
              <MiniCalendar onSelectDate={() => navigate('/receptionist/appointments')} />
            </div>

            {/* Quick actions */}
            <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E8EFF8', padding: '14px 12px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <QuickAction label="New Appointment"  description="Book for existing patient"    icon={<IcoPlus  />} accent={ACCENT}   onClick={() => navigate('/receptionist/appointments/new')} />
                <QuickAction label="Register Patient"  description="Add a new patient record"    icon={<IcoUser  />} accent="#10B981"  onClick={() => navigate('/receptionist/patients/register')} />
                <QuickAction label="Process Checkout"  description="Collect fees and close visits" icon={<IcoCash  />} accent="#F59E0B"  onClick={() => navigate('/receptionist/checkout')} />
                <QuickAction label="Pending Reviews"   description={`${pendingReg.length} awaiting activation`} icon={<IcoClip  />} accent="#8B5CF6"  onClick={() => navigate('/receptionist/pending-registrations')} />
              </div>
            </div>

            {/* Checkout queue */}
            {!loading && checkoutQueue.length > 0 && (
              <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #FDE68A', padding: '14px 12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Awaiting Checkout</div>
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', borderRadius: 20, padding: '2px 7px' }}>{checkoutQueue.length}</span>
                </div>
                {checkoutQueue.slice(0, 4).map(v => (
                  <div key={v.visit_id} onClick={() => navigate('/receptionist/checkout')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 9, background: '#FFFBEB', border: '1px solid #FDE68A', marginBottom: 5, cursor: 'pointer', transition: 'all 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FEF3C7'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FFFBEB'; }}>
                    <PatientAvatar name={`${v.patient_first_name} ${v.patient_last_name}`} size={24} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#92400E', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.patient_first_name} {v.patient_last_name}</div>
                    <span style={{ color: '#D97706', flexShrink: 0 }}><IcoArrow /></span>
                  </div>
                ))}
                {checkoutQueue.length > 4 && (
                  <button onClick={() => navigate('/receptionist/checkout')}
                    style={{ width: '100%', textAlign: 'center', fontSize: 11, fontWeight: 600, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0' }}>
                    View all {checkoutQueue.length}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, color, textColor }) {
  return <span style={{ fontSize: 9, fontWeight: 600, background: color, color: textColor, borderRadius: 20, padding: '2px 7px' }}>{label}</span>;
}
