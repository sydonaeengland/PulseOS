import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getDoctorView,
  getDoctorViewWeek,
  getAppointments,
  checkinAppointment,
  undoCheckinAppointment,
  cancelAppointment,
  noShowAppointment,
  rescheduleAppointment,
  triageAppointment,
  triageCompleteAppointment,
  getScheduleBlocked,
  createBlockedTime,
  deleteBlockedTime,
  getDoctorWorkingHours,
  saveDoctorWorkingHours,
} from '../../api/appointments';
import { toast } from '../../components/UndoToast';

const ACCENT = '#0EA5E9';
const DARK   = '#0A2540';

// ─── Status config ────────────────────────────────────────────────
const STATUS = {
  scheduled:  { bg: '#EFF8FF', border: '#BAE6FD', color: '#0369A1', label: 'Scheduled',  dot: '#0EA5E9' },
  checked_in: { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D', label: 'Checked In', dot: '#22C55E' },
  triage:     { bg: '#FEF3C7', border: '#FDE68A', color: '#92400E', label: 'Checked In',  dot: '#F59E0B' },
  waiting:    { bg: '#EDE9FE', border: '#DDD6FE', color: '#5B21B6', label: 'Waiting',     dot: '#8B5CF6' },
  completed:  { bg: '#F8FAFC', border: '#E2E8F0', color: '#64748B', label: 'Completed',   dot: '#94A3B8' },
  cancelled:  { bg: '#FFF1F2', border: '#FECDD3', color: '#E11D48', label: 'Cancelled',   dot: '#F43F5E' },
  no_show:    { bg: '#FFF7ED', border: '#FED7AA', color: '#D97706', label: 'No Show',     dot: '#F59E0B' },
};

const HOUR_START = 7;
const HOUR_END   = 19;
const HOUR_H     = 160; // 160px/hr = 40px per 15-min slot
const SLOT_H     = HOUR_H / 4; // 40px per 15-min slot
const TIMELINE_H = (HOUR_END - HOUR_START) * HOUR_H;

// ─── Helpers ─────────────────────────────────────────────────────
// Use local time — NOT UTC — so Jamaica doesn't roll over to the next day
function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function localNowMins() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}
function fmtTimeShort(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}
function timeToMins(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minsToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = String(mins % 60).padStart(2, '0');
  return `${String(h).padStart(2, '0')}:${m}`;
}
function fmtTimeRange(startT, durationMins) {
  const start = timeToMins(startT);
  const end   = start + (durationMins ?? 15);
  return `${fmtTimeShort(startT)} – ${fmtTimeShort(minsToTime(end))}`;
}
// Returns layout columns for a set of appointments (overlap groups)
function layoutAppts(appts) {
  const sorted = [...appts].sort((a, b) => timeToMins(a.appointment_time) - timeToMins(b.appointment_time));
  const layout = new Map(); // appt.id -> { col, totalCols }
  const columns = []; // each entry: end time of last appt in that column

  for (const appt of sorted) {
    const start = timeToMins(appt.appointment_time);
    const end   = start + (appt.duration_minutes ?? 15);
    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      if (columns[c] <= start) {
        columns[c] = end;
        layout.set(appt.id, { col: c });
        placed = true;
        break;
      }
    }
    if (!placed) {
      layout.set(appt.id, { col: columns.length });
      columns.push(end);
    }
  }

  // Second pass: determine how many columns overlap at each appt's time
  for (const appt of sorted) {
    const start = timeToMins(appt.appointment_time);
    const end   = start + (appt.duration_minutes ?? 15);
    let maxCols = 1;
    for (const other of sorted) {
      if (other.id === appt.id) continue;
      const os = timeToMins(other.appointment_time);
      const oe = os + (other.duration_minutes ?? 15);
      if (start < oe && end > os) {
        maxCols = Math.max(maxCols, (layout.get(other.id)?.col ?? 0) + 1);
      }
    }
    const entry = layout.get(appt.id);
    if (entry) entry.totalCols = Math.max(maxCols, entry.col + 1);
  }

  return layout;
}
function fmtDateLong(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-JM', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-JM', { weekday: 'short', month: 'short', day: 'numeric' });
}
function getWeekDays(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(mon); dd.setDate(mon.getDate() + i);
    return toDateStr(dd);
  });
}

// Patient initials — include middle initial if present
function patientInitials(appt) {
  const f = appt.patient_first_name?.[0] ?? '';
  const m = appt.patient_middle_name?.[0] ?? '';
  const l = appt.patient_last_name?.[0] ?? '';
  return (f + m + l).toUpperCase();
}
function patientFullName(appt) {
  const mid = appt.patient_middle_name ? ` ${appt.patient_middle_name}` : '';
  return `${appt.patient_first_name}${mid} ${appt.patient_last_name}`;
}

const AV_COLORS = ['#0EA5E9','#10B981','#8B5CF6','#F59E0B','#EF4444','#06B6D4','#EC4899'];
function nameColor(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return AV_COLORS[Math.abs(h) % AV_COLORS.length];
}

// ─── Icons ───────────────────────────────────────────────────────
const Ico = ({ d, size = 14 }) => <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={d}/></svg>;
function IcoPlus()    { return <Ico d="M12 4v16m8-8H4"/>; }
function IcoChevL()  { return <Ico d="M15 19l-7-7 7-7"/>; }
function IcoChevR()  { return <Ico d="M9 5l7 7-7 7"/>; }
function IcoRefresh() { return <Ico size={13} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>; }
function IcoList()   { return <Ico d="M4 6h16M4 10h16M4 14h16M4 18h16"/>; }
function IcoCal()    { return <Ico d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>; }
function IcoDoc()    { return <Ico d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>; }
function IcoBlock()  { return <Ico d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>; }
function IcoWalk()   { return <Ico d="M13 7h-2m1 0V5m0 2a2 2 0 110 4 2 2 0 010-4zm0 4v6m-3-3h6"/>; }
function IcoX()      { return <Ico size={12} d="M6 18L18 6M6 6l12 12"/>; }
function IcoFilter() { return <Ico d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>; }
function IcoUndo()   { return <Ico d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>; }

// ─── Avatar circle ────────────────────────────────────────────────
function Avatar({ appt, size = 28 }) {
  const inits = patientInitials(appt);
  const name  = patientFullName(appt);
  const bg    = nameColor(name);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: bg + '22', border: `1.5px solid ${bg}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.floor(size * 0.33), fontWeight: 800, color: bg, userSelect: 'none', letterSpacing: '-0.5px' }}>
      {inits}
    </div>
  );
}

// ─── Reschedule modal ─────────────────────────────────────────────
function RescheduleModal({ appt, token, onClose, onDone }) {
  const [date, setDate] = useState(appt.appointment_date ?? '');
  const [time, setTime] = useState(appt.appointment_time?.slice(0, 5) ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const save = async () => {
    if (!date || !time) { setErr('Both fields are required'); return; }
    setSaving(true);
    try { await rescheduleAppointment(appt.id, { appointment_date: date, appointment_time: time }, token); onDone(); }
    catch (e) { setErr(e.response?.data?.message ?? 'Failed'); setSaving(false); }
  };
  return (
    <Modal onClose={onClose} title="Reschedule" sub={`${patientFullName(appt)} — Dr. ${appt.doctor_last_name}`}>
      <FField label="New Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={fInput}/></FField>
      <FField label="New Time"><input type="time" value={time} onChange={e => setTime(e.target.value)} style={fInput}/></FField>
      {err && <div style={{ fontSize: 12, color: '#E11D48', marginBottom: 10 }}>{err}</div>}
      <ModalBtns onCancel={onClose} onSave={save} saving={saving} saveLabel="Reschedule" />
    </Modal>
  );
}

// ─── Triage modal ─────────────────────────────────────────────────
function TriageModal({ appt, token, onClose, onDone }) {
  const [urgency, setUrgency] = useState('routine');
  const [saving, setSaving] = useState(false);
  const LEVELS = [
    { key: 'routine',   label: 'Routine',   color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0', desc: 'Standard visit, no immediate concern' },
    { key: 'priority',  label: 'Priority',  color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', desc: 'Needs prompt attention within the hour' },
    { key: 'emergency', label: 'Emergency', color: '#EF4444', bg: '#FFF1F2', border: '#FECDD3', desc: 'Immediate medical attention required' },
  ];
  const save = async () => {
    setSaving(true);
    try { await triageAppointment(appt.id, urgency, token); toast(`Triage set: ${urgency} — ${patientFullName(appt)}`); onDone(); }
    catch { setSaving(false); }
  };
  return (
    <Modal onClose={onClose} title="Triage Assessment" sub={patientFullName(appt)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {LEVELS.map(l => (
          <button key={l.key} onClick={() => setUrgency(l.key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, border: `2px solid ${urgency === l.key ? l.color : '#E2E8F0'}`, background: urgency === l.key ? l.bg : '#FAFBFC', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: urgency === l.key ? l.color : '#0F172A' }}>{l.label}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>{l.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <ModalBtns onCancel={onClose} onSave={save} saving={saving} saveLabel="Start Triage" saveColor="#F59E0B" />
    </Modal>
  );
}

// ─── Block time modal ─────────────────────────────────────────────
function BlockModal({ doctorId, doctorName, date, token, onClose, onDone }) {
  const [start, setStart] = useState('12:00');
  const [end, setEnd]     = useState('13:00');
  const [reason, setReason] = useState('Lunch break');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const save = async () => {
    if (!start || !end) { setErr('Start and end time required'); return; }
    setSaving(true);
    try { await createBlockedTime({ doctor_id: doctorId, date, start_time: start, end_time: end, reason }, token); toast('Time blocked'); onDone(); }
    catch (e) { setErr(e.response?.data?.message ?? 'Failed'); setSaving(false); }
  };
  return (
    <Modal onClose={onClose} title="Block Time" sub={`Dr. ${doctorName} — ${fmtDate(date)}`}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FField label="Start"><input type="time" value={start} onChange={e => setStart(e.target.value)} style={fInput}/></FField>
        <FField label="End"><input type="time" value={end}   onChange={e => setEnd(e.target.value)}   style={fInput}/></FField>
      </div>
      <FField label="Reason">
        <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Lunch break" style={{...fInput, marginTop: 2}}/>
      </FField>
      {err && <div style={{ fontSize: 12, color: '#E11D48', marginBottom: 10 }}>{err}</div>}
      <ModalBtns onCancel={onClose} onSave={save} saving={saving} saveLabel="Block" saveColor="#64748B" />
    </Modal>
  );
}

// Find next free slot for a doctor given existing appointments
function findNextFreeSlot(doctorAppts, durationMins = 20) {
  const now = new Date();
  // round up to next 15-min boundary
  const base = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15;
  const end  = 17 * 60; // stop suggesting after 5pm
  const occupied = doctorAppts.map(a => ({
    start: timeToMins(a.appointment_time),
    end:   timeToMins(a.appointment_time) + (a.duration_minutes ?? 15),
  }));
  let candidate = base;
  while (candidate + durationMins <= end) {
    const overlaps = occupied.some(o => candidate < o.end && candidate + durationMins > o.start);
    if (!overlaps) {
      const h = Math.floor(candidate / 60);
      const m = String(candidate % 60).padStart(2, '0');
      return `${String(h).padStart(2, '0')}:${m}`;
    }
    candidate += 15;
  }
  return null; // no slot found today
}

// ─── Walk-in modal ────────────────────────────────────────────────
function WalkInModal({ doctors, doctorApptsByDoctor, date, token, onClose }) {
  const navigate   = useNavigate();
  const [doctorId, setDoctorId]   = useState(String(doctors[0]?.id ?? ''));
  const [duration, setDuration]   = useState('20');
  const [reason, setReason]       = useState('');
  const [suggestedTime, setSuggested] = useState(null);

  useEffect(() => {
    const appts = doctorApptsByDoctor[parseInt(doctorId, 10)] ?? [];
    setSuggested(findNextFreeSlot(appts, parseInt(duration, 10)));
  }, [doctorId, duration, doctorApptsByDoctor]);

  const go = () => {
    if (!suggestedTime) return;
    navigate(`/receptionist/appointments/new?date=${date}&doctor=${doctorId}&walkIn=1&time=${suggestedTime}&duration=${duration}&reason=${encodeURIComponent(reason)}`);
    onClose();
  };

  const selectedDoc = doctors.find(d => String(d.id) === doctorId);
  const busyCount = (doctorApptsByDoctor[parseInt(doctorId, 10)] ?? [])
    .filter(a => ['checked_in','triage','waiting'].includes(a.status)).length;

  return (
    <Modal onClose={onClose} title="Walk-In Patient" sub="Book an unscheduled arrival">
      <FField label="Assign to Doctor">
        <select value={doctorId} onChange={e => setDoctorId(e.target.value)} style={fInput}>
          {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>)}
        </select>
      </FField>
      {selectedDoc && (
        <div style={{ background: '#F8FAFC', borderRadius: 9, padding: '9px 12px', marginBottom: 14, fontSize: 12 }}>
          <span style={{ color: '#64748B' }}>Dr. {selectedDoc.last_name} has </span>
          <span style={{ fontWeight: 700, color: busyCount > 0 ? '#D97706' : '#10B981' }}>{busyCount} patient{busyCount !== 1 ? 's' : ''} currently in clinic</span>
          {suggestedTime ? (
            <span style={{ color: '#64748B' }}> — next free slot: <strong style={{ color: '#0EA5E9' }}>{fmtTime(suggestedTime)}</strong></span>
          ) : (
            <span style={{ color: '#E11D48', fontWeight: 600 }}> — no free slots today</span>
          )}
        </div>
      )}
      <FField label="Duration">
        <select value={duration} onChange={e => setDuration(e.target.value)} style={fInput}>
          <option value="10">10 min</option>
          <option value="15">15 min</option>
          <option value="20">20 min</option>
          <option value="30">30 min</option>
          <option value="45">45 min</option>
        </select>
      </FField>
      <FField label="Chief Complaint">
        <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Brief reason for visit" style={fInput}/>
      </FField>
      {!suggestedTime && (
        <div style={{ fontSize: 12, color: '#E11D48', marginBottom: 12, padding: '9px 12px', background: '#FFF1F2', borderRadius: 8, border: '1px solid #FECDD3' }}>
          No available slots remaining today for this doctor.
        </div>
      )}
      <ModalBtns onCancel={onClose} onSave={go} saving={false} saveLabel={suggestedTime ? `Book at ${fmtTime(suggestedTime)}` : 'No slots'} saveColor={suggestedTime ? '#10B981' : '#94A3B8'} />
    </Modal>
  );
}

// ─── Working hours editor modal ────────────────────────────────────
function WorkingHoursModal({ doctor, token, onClose, onDone }) {
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DEFAULT_HOURS = DAYS.map((_, i) => ({
    day_of_week: i,
    start_time: '08:00',
    end_time: '17:00',
    is_working: i >= 1 && i <= 5,
  }));
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getDoctorWorkingHours(doctor.id, token)
      .then(r => {
        const rows = r.data?.data?.working_hours ?? [];
        if (rows.length > 0) {
          const map = Object.fromEntries(rows.map(r => [r.day_of_week, r]));
          setHours(DAYS.map((_, i) => ({
            day_of_week: i,
            start_time: map[i]?.start_time?.slice(0,5) ?? '08:00',
            end_time:   map[i]?.end_time?.slice(0,5)   ?? '17:00',
            is_working: map[i]?.is_working ?? (i >= 1 && i <= 5),
          })));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [doctor.id, token]);

  const update = (i, field, value) => setHours(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));

  const save = async () => {
    setSaving(true);
    try {
      await saveDoctorWorkingHours(doctor.id, hours.map(h => ({ ...h, start_time: h.start_time + ':00', end_time: h.end_time + ':00' })), token);
      toast(`Working hours saved for Dr. ${doctor.last_name}`);
      onDone();
    } catch { setSaving(false); }
  };

  return (
    <Modal onClose={onClose} title={`Dr. ${doctor.first_name} ${doctor.last_name} — Working Hours`} sub="Edit weekly schedule" wide>
      {!loaded ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {DAYS.map((day, i) => {
            const h = hours[i];
            return (
              <div key={day} style={{ display: 'grid', gridTemplateColumns: '90px 34px 1fr 1fr', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, background: h.is_working ? '#F8FAFC' : '#FAFBFC', border: `1px solid ${h.is_working ? '#E8EFF8' : '#F1F5F9'}` }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: h.is_working ? '#0F172A' : '#CBD5E1' }}>{day}</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" checked={!!h.is_working} onChange={e => update(i, 'is_working', e.target.checked)} style={{ width: 15, height: 15, accentColor: ACCENT, cursor: 'pointer' }}/>
                </div>
                <input type="time" value={h.start_time} disabled={!h.is_working} onChange={e => update(i, 'start_time', e.target.value)}
                  style={{ ...fInput, opacity: h.is_working ? 1 : 0.35, marginBottom: 0 }}/>
                <input type="time" value={h.end_time}   disabled={!h.is_working} onChange={e => update(i, 'end_time', e.target.value)}
                  style={{ ...fInput, opacity: h.is_working ? 1 : 0.35, marginBottom: 0 }}/>
              </div>
            );
          })}
        </div>
      )}
      <ModalBtns onCancel={onClose} onSave={save} saving={saving} saveLabel="Save Hours" />
    </Modal>
  );
}

// ─── Shared modal shell ───────────────────────────────────────────
function Modal({ onClose, title, sub, children, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(10,37,64,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#FFF', borderRadius: 18, padding: 26, width: wide ? 520 : 400, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 18 }}>{sub}</div>}
        {children}
      </div>
    </div>
  );
}
function FField({ label, children }) {
  return <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 5 }}>{label}</label>{children}</div>;
}
const fInput = {
  width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 8,
  border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', outline: 'none',
  background: '#FFF', fontFamily: 'inherit',
};
function ModalBtns({ onCancel, onSave, saving, saveLabel = 'Save', saveColor = ACCENT }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={onCancel} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
      <button onClick={onSave} disabled={saving} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', background: saveColor, color: '#FFF', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : saveLabel}</button>
    </div>
  );
}

// ─── Appointment detail popover ───────────────────────────────────
function ApptPopover({ appt, token, onRefresh, onClose, anchor }) {
  const navigate = useNavigate();
  const s = STATUS[appt.status] ?? STATUS.scheduled;
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const name = patientFullName(appt);
  const bg   = nameColor(name);

  const act = async (fn, label, undoFn) => {
    setLoading(true);
    try {
      await fn();
      onClose();
      toast(label, undoFn ? { undo: async () => { await undoFn(); onRefresh(); }, duration: 6000 } : undefined);
      onRefresh();
    } catch { setLoading(false); }
  };

  const canCheckin      = appt.status === 'scheduled';
  const canUndoCheckin  = appt.status === 'triage'; // undo goes back to scheduled
  const canTriage       = false; // auto-triggered on check-in
  const canTriageDone   = appt.status === 'triage';
  // Patient wants to leave mid-visit (was triage or waiting)
  const canPatientLeave = ['triage','waiting'].includes(appt.status);
  const canCancel       = appt.status === 'scheduled';
  const canNoShow       = appt.status === 'scheduled';
  const canResched      = appt.status === 'scheduled';

  if (modal === 'resched') return <RescheduleModal appt={appt} token={token} onClose={() => setModal(null)} onDone={() => { setModal(null); onClose(); onRefresh(); toast('Rescheduled'); }}/>;
  if (modal === 'triage')  return <TriageModal     appt={appt} token={token} onClose={() => setModal(null)} onDone={() => { setModal(null); onClose(); onRefresh(); }}/>;

  const popW = 272;
  const left = Math.min(anchor.x + 10, window.innerWidth - popW - 10);
  const top  = Math.min(anchor.y, window.innerHeight - 380);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={onClose}/>
      <div style={{ position: 'fixed', top, left, zIndex: 300, background: '#FFF', borderRadius: 14, border: '1px solid #E8EFF8', boxShadow: '0 16px 48px rgba(10,37,64,0.16)', width: popW, overflow: 'hidden' }}>
        <div style={{ height: 4, background: s.dot }}/>
        <div style={{ padding: '14px 16px 12px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar appt={appt} size={34}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>Dr. {appt.doctor_last_name}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>{s.label}</span>
          </div>
          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 11, padding: '9px 11px', background: '#F8FAFC', borderRadius: 9 }}>
            {[
              ['Time',     fmtTime(appt.appointment_time)],
              ['Duration', `${appt.duration_minutes ?? 15} min`],
              ['Type',     appt.visit_type ?? 'General'],
              appt.reason ? ['Reason', appt.reason] : null,
              appt.triage_urgency && appt.status === 'triage' ? ['Triage', appt.triage_urgency] : null,
            ].filter(Boolean).map(([label, val]) => (
              <div key={label} style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', minWidth: 50 }}>{label}</span>
                <span style={{ fontSize: 12, color: '#475569' }}>{val}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: '#F1F5F9', marginBottom: 9 }}/>
          {/* New patient registration reminder */}
          {canCheckin && appt.visit_type === 'Walk-in' && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 10px', marginBottom: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#92400E', lineHeight: 1.5 }}>
                Walk-in patient — confirm registration is complete before checking in.
              </div>
              <button
                onClick={() => { onClose(); navigate('/receptionist/patients/register'); }}
                style={{ fontSize: 10, fontWeight: 700, color: '#0EA5E9', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0, textDecoration: 'underline', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#0369A1'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#0EA5E9'; }}
              >
                Register
              </button>
            </div>
          )}
          {loading ? (
            <div style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', padding: '8px 0' }}>Working…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {canCheckin      && <PAct label="Check In" color="#059669" bg="#F0FDF4"
                onClick={() => act(() => checkinAppointment(appt.id, token), `Checked in — ${name}`,
                  () => undoCheckinAppointment(appt.id, token))} />}
              {canUndoCheckin  && <PAct label="Undo Check-In" color="#64748B" bg="#F8FAFC" icon={<IcoUndo/>}
                onClick={() => act(() => undoCheckinAppointment(appt.id, token), `Check-in undone`)} />}
              {canTriage       && <PAct label="Send to Triage"    color="#D97706" bg="#FFFBEB" onClick={() => setModal('triage')}/>}
              {canTriageDone   && <PAct label="Triage Complete — Move to Waiting" color="#8B5CF6" bg="#EDE9FE"
                onClick={() => act(() => triageCompleteAppointment(appt.id, token), 'Moved to waiting')}/>}
              {canPatientLeave && <PAct label="Patient Leaving — Cancel Visit" color="#DC2626" bg="#FFF1F2"
                onClick={() => act(() => cancelAppointment(appt.id, token), `Visit cancelled — ${name} left`)}/>}
              {canResched      && <PAct label="Reschedule"        color={DARK}    bg="#EFF8FF" onClick={() => setModal('resched')}/>}
              {canNoShow       && <PAct label="Mark No Show"      color="#D97706" bg="#FFFBEB"
                onClick={() => act(() => noShowAppointment(appt.id, token), 'Marked no show')}/>}
              {canCancel       && <PAct label="Cancel Appointment" color="#E11D48" bg="#FFF1F2"
                onClick={() => act(() => cancelAppointment(appt.id, token), 'Appointment cancelled')}/>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PAct({ label, color, bg, onClick, icon }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${hov ? color + '40' : 'transparent'}`, background: hov ? bg : 'transparent', color, fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.1s' }}>
      {icon}<span>{label}</span>
    </button>
  );
}

// ─── Now indicator ────────────────────────────────────────────────
function NowLine() {
  const now  = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const top  = ((mins - HOUR_START * 60) / 60) * HOUR_H;
  if (top < 0 || top > TIMELINE_H) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, zIndex: 20, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }}/>
      <div style={{ flex: 1, height: 1.5, background: '#EF4444' }}/>
    </div>
  );
}

// ─── Blocked time block ───────────────────────────────────────────
function BlockedBlock({ block, onDelete, token }) {
  const [hov, setHov] = useState(false);
  const startMins = timeToMins(block.start_time);
  const endMins   = timeToMins(block.end_time);
  const top    = ((startMins - HOUR_START * 60) / 60) * HOUR_H;
  const height = Math.max(16, ((endMins - startMins) / 60) * HOUR_H - 3);
  if (top < 0) return null;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position: 'absolute', top, left: 2, right: 2, height: Math.min(height, TIMELINE_H - top - 2), borderRadius: 7, background: hov ? '#F1F5F9' : '#F8FAFC', border: '1.5px dashed #CBD5E1', zIndex: 2, padding: '3px 6px', overflow: 'hidden', cursor: 'default', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>BLOCKED</div>
        {height >= 30 && <div style={{ fontSize: 9, color: '#CBD5E1', marginTop: 1 }}>{block.reason ?? ''}</div>}
      </div>
      {hov && (
        <button onClick={() => onDelete(block.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E11D48', padding: 1, display: 'flex', flexShrink: 0 }}>
          <IcoX/>
        </button>
      )}
    </div>
  );
}

// ─── Appointment event block ──────────────────────────────────────
function EventBlock({ appt, onSelect, isToday, layoutCol = 0, layoutCols = 1 }) {
  const mins    = timeToMins(appt.appointment_time);
  const top     = ((mins - HOUR_START * 60) / 60) * HOUR_H;
  const height  = Math.max(SLOT_H - 2, ((appt.duration_minutes ?? 15) / 60) * HOUR_H - 2);
  const [hov, setHov] = useState(false);
  const name    = patientFullName(appt);
  const isWalkIn = appt.visit_type === 'Walk-in';

  const nowMins  = localNowMins();
  const isOverdue = isToday && appt.status === 'scheduled' && mins + (appt.duration_minutes ?? 15) < nowMins;

  const s = isOverdue
    ? { bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C', label: 'Overdue', dot: '#F97316' }
    : STATUS[appt.status] ?? STATUS.scheduled;

  if (top < 0 || top > TIMELINE_H) return null;

  // Overlap layout: divide column width evenly
  const pct = 100 / layoutCols;
  const leftPct  = layoutCol * pct;
  const rightPct = 100 - (layoutCol + 1) * pct;
  const gap = layoutCols > 1 ? 2 : 3;

  const reason = appt.reason
    ? appt.reason.charAt(0).toUpperCase() + appt.reason.slice(1)
    : null;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={e => { e.stopPropagation(); onSelect(appt, { x: e.clientX, y: e.clientY }); }}
      style={{
        position: 'absolute',
        top,
        left: `calc(${leftPct}% + ${gap}px)`,
        right: `calc(${rightPct}% + ${gap}px)`,
        height: Math.min(height, TIMELINE_H - top - 2),
        borderRadius: 0,
        background: s.bg,
        borderLeft: `3px solid ${s.dot}`,
        borderTop: `1px solid ${s.border}`,
        borderBottom: `1px solid ${s.border}`,
        borderRight: `1px solid ${s.border}`,
        boxShadow: isOverdue ? `0 0 0 2px #F9731640` : hov ? `0 1px 8px ${s.dot}35` : 'none',
        padding: '4px 6px',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'box-shadow 0.1s',
        zIndex: hov ? 10 : 3,
      }}>
      {/* Time range + badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, lineHeight: 1 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: s.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {fmtTimeRange(appt.appointment_time, appt.duration_minutes ?? 15)}
        </span>
        {isOverdue && <span style={{ fontSize: 7, fontWeight: 800, color: '#C2410C', background: '#FED7AA', borderRadius: 3, padding: '0 3px', flexShrink: 0, letterSpacing: '0.2px' }}>LATE</span>}
        {isWalkIn  && <span style={{ fontSize: 7, fontWeight: 800, color: '#92400E', background: '#FEF3C7', borderRadius: 3, padding: '0 3px', flexShrink: 0 }}>WALK-IN</span>}
      </div>
      {/* Patient name */}
      <div style={{ fontSize: 11, fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2, lineHeight: 1.2 }}>
        {name}
      </div>
      {/* Reason — only when tall enough */}
      {height >= 72 && reason && (
        <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reason}</div>
      )}
    </div>
  );
}

const DOCS_PER_PAGE = 3;

// ─── Doctor Day View ──────────────────────────────────────────────
function DoctorDayView({ doctors, appointmentsByDoctor, blockedByDoctor, selectedDate, isToday, onSelectAppt, onAddForDoctor, onBlockForDoctor, onDeleteBlock, onEditHours, token, filterDoctor }) {
  const scrollRef = useRef(null);
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const allFiltered = filterDoctor === 'all' ? doctors : doctors.filter(d => d.id === parseInt(filterDoctor, 10));

  // Pagination — only applies when showing all doctors (not single-doctor filter)
  const paginate = filterDoctor === 'all' && allFiltered.length > DOCS_PER_PAGE;
  const [docPage, setDocPage] = useState(0);
  const pageCount = paginate ? Math.ceil(allFiltered.length / DOCS_PER_PAGE) : 1;
  const safeDocPage = Math.min(docPage, pageCount - 1);
  const visibleDoctors = paginate
    ? allFiltered.slice(safeDocPage * DOCS_PER_PAGE, safeDocPage * DOCS_PER_PAGE + DOCS_PER_PAGE)
    : allFiltered;

  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const top = ((now.getHours() * 60 + now.getMinutes() - HOUR_START * 60) / 60) * HOUR_H;
    scrollRef.current.scrollTop = Math.max(0, top - 80);
  }, []);

  if (visibleDoctors.length === 0) return (
    <div style={{ flex: 1, background: '#FFF', borderRadius: 16, border: '1px solid #E8EFF8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No doctors found</div>
    </div>
  );

  // Build non-working shade regions per doctor
  // working_hours: { start_time, end_time, is_working }
  function getOffShadeRegions(doc) {
    const wh = doc.working_hours;
    if (!wh || !wh.is_working) {
      // Entire day shaded
      return [{ top: 0, height: TIMELINE_H }];
    }
    const wStart = timeToMins(wh.start_time);
    const wEnd   = timeToMins(wh.end_time);
    const regions = [];
    // Before working hours
    if (wStart > HOUR_START * 60) {
      const top = 0;
      const height = ((wStart - HOUR_START * 60) / 60) * HOUR_H;
      regions.push({ top, height });
    }
    // After working hours
    if (wEnd < HOUR_END * 60) {
      const top = ((wEnd - HOUR_START * 60) / 60) * HOUR_H;
      const height = TIMELINE_H - top;
      regions.push({ top, height });
    }
    return regions;
  }

  const colMin = 190;

  return (
    <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E8EFF8', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Doctor header row — grid matches timeline exactly: 58px gutter + N doctor cols */}
      <div style={{ display: 'grid', gridTemplateColumns: `58px repeat(${visibleDoctors.length}, minmax(${colMin}px, 1fr))`, borderBottom: '1px solid #E8EFF8', flexShrink: 0, background: '#FAFBFD', position: 'relative' }}>
        {/* Time-gutter cell — houses the pagination arrows as an overlay */}
        <div style={{ borderRight: '1px solid #F1F5F9', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0' }}>
          {paginate && (
            <>
              <button
                onClick={() => setDocPage(p => Math.max(0, p - 1))}
                disabled={safeDocPage === 0}
                style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #E2E8F0', background: '#FFF', color: safeDocPage === 0 ? '#CBD5E1' : '#475569', cursor: safeDocPage === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
              </button>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8' }}>{safeDocPage + 1}/{pageCount}</span>
              <button
                onClick={() => setDocPage(p => Math.min(pageCount - 1, p + 1))}
                disabled={safeDocPage >= pageCount - 1}
                style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #E2E8F0', background: '#FFF', color: safeDocPage >= pageCount - 1 ? '#CBD5E1' : '#475569', cursor: safeDocPage >= pageCount - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
            </>
          )}
        </div>
        {visibleDoctors.map((doc, i) => {
          const appts = appointmentsByDoctor[doc.id] ?? [];
          const bg = nameColor(`${doc.first_name}${doc.last_name}`);
          const checked = appts.filter(a => a.status === 'checked_in' || a.status === 'triage' || a.status === 'waiting').length;
          return (
            <div key={doc.id} style={{ borderRight: i < visibleDoctors.length - 1 ? '6px solid #F0F4F8' : 'none', borderTop: `3px solid ${bg}`, padding: '12px 16px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Top row: avatar + name + count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: bg + '18', border: `2px solid ${bg}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: bg, flexShrink: 0, letterSpacing: '-0.3px' }}>
                  {(doc.first_name?.[0] ?? '') + (doc.last_name?.[0] ?? '')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>Dr. {doc.first_name} {doc.last_name}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{appts.length} appt{appts.length !== 1 ? 's' : ''}{checked > 0 ? <span style={{ color: '#10B981', fontWeight: 600 }}> · {checked} in clinic</span> : ''}</div>
                </div>
              </div>
              {/* Bottom row: action buttons */}
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => onEditHours(doc)} title="Edit working hours"
                  style={{ height: 24, padding: '0 8px', borderRadius: 6, background: '#EFF8FF', border: `1px solid ${ACCENT}33`, color: ACCENT, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#DBEFFE'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#EFF8FF'; }}>
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Hours
                </button>
                <button onClick={() => onBlockForDoctor(doc)} title="Block a time slot"
                  style={{ height: 24, padding: '0 8px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; }}>
                  <IcoBlock/>
                  Block
                </button>
                <button onClick={() => onAddForDoctor(doc.id)} title="New appointment"
                  style={{ height: 24, padding: '0 8px', borderRadius: 6, background: ACCENT, border: 'none', color: '#FFF', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#0284C7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ACCENT; }}>
                  <IcoPlus/>
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div ref={scrollRef} style={{ overflowY: 'auto', overflowX: 'auto', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `58px repeat(${visibleDoctors.length}, minmax(${colMin}px, 1fr))`, minWidth: visibleDoctors.length * colMin + 58 }}>
          {/* Hour + 15-min labels */}
          <div style={{ borderRight: '1px solid #E8EFF8', background: '#FAFBFC', position: 'sticky', left: 0, zIndex: 5 }}>
            {hours.map(h => (
              <div key={h} style={{ height: HOUR_H, boxSizing: 'border-box', position: 'relative', borderBottom: '1px solid #E8EFF8' }}>
                {/* Hour label */}
                <div style={{ position: 'absolute', top: 0, right: 5, display: 'flex', alignItems: 'center', height: 12, transform: 'translateY(-50%)' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', whiteSpace: 'nowrap' }}>{h % 12 || 12}{h >= 12 ? 'pm' : 'am'}</span>
                </div>
                {/* :15 mark */}
                <div style={{ position: 'absolute', top: SLOT_H, right: 5, height: 12, display: 'flex', alignItems: 'center', transform: 'translateY(-50%)' }}>
                  <span style={{ fontSize: 8, color: '#CBD5E1' }}>:15</span>
                </div>
                {/* :30 mark */}
                <div style={{ position: 'absolute', top: SLOT_H * 2, right: 5, height: 12, display: 'flex', alignItems: 'center', transform: 'translateY(-50%)' }}>
                  <span style={{ fontSize: 8, color: '#B0BEC5' }}>:30</span>
                </div>
                {/* :45 mark */}
                <div style={{ position: 'absolute', top: SLOT_H * 3, right: 5, height: 12, display: 'flex', alignItems: 'center', transform: 'translateY(-50%)' }}>
                  <span style={{ fontSize: 8, color: '#CBD5E1' }}>:45</span>
                </div>
              </div>
            ))}
          </div>

          {/* Doctor columns */}
          {visibleDoctors.map((doc, ci) => {
            const appts   = appointmentsByDoctor[doc.id] ?? [];
            const blocked = blockedByDoctor[doc.id] ?? [];
            const offRegions = getOffShadeRegions(doc);
            const allDay     = !doc.working_hours || !doc.working_hours.is_working;
            const docColor   = nameColor(`${doc.first_name}${doc.last_name}`);
            return (
              <div key={doc.id} style={{ position: 'relative', height: TIMELINE_H, borderLeft: ci > 0 ? '6px solid #F0F4F8' : 'none', borderTop: `2px solid ${docColor}30` }}>
                {/* Non-working hour shade */}
                {offRegions.map((r, ri) => (
                  <div key={`shade${ri}`} style={{ position: 'absolute', top: r.top, left: 0, right: 0, height: r.height, background: 'rgba(241,245,249,0.65)', zIndex: 1, pointerEvents: 'none' }} />
                ))}
                {/* "Not scheduled" label when whole day off */}
                {allDay && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 2, textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>Not scheduled</div>
                    <div style={{ fontSize: 10, color: '#CBD5E1', marginTop: 2 }}>No working hours set</div>
                  </div>
                )}
                {/* Hour lines — solid, full width */}
                {hours.map((_, hi) => (
                  <div key={hi} style={{ position: 'absolute', top: hi * HOUR_H, left: 0, right: 0, height: 1, background: '#E8EFF8' }}/>
                ))}
                {/* :30 lines — medium dashed */}
                {hours.map((_, hi) => (
                  <div key={`h${hi}`} style={{ position: 'absolute', top: hi * HOUR_H + SLOT_H * 2, left: 0, right: 0, height: 1, background: '#EEF4FB', borderTop: '1px dashed #DDE6F0' }}/>
                ))}
                {/* :15 and :45 lines — faint dotted */}
                {hours.map((_, hi) => [1, 3].map(q => (
                  <div key={`q${hi}${q}`} style={{ position: 'absolute', top: hi * HOUR_H + q * SLOT_H, left: 0, right: 0, height: 1, background: '#F4F8FC' }}/>
                )))}
                {isToday && <NowLine/>}
                {blocked.map(b => <BlockedBlock key={b.id} block={b} token={token} onDelete={async (id) => { await deleteBlockedTime(id, doc.id, token); onDeleteBlock(); }}/>)}
                {(() => {
                  const layout = layoutAppts(appts);
                  return appts.map(a => {
                    const info = layout.get(a.id) ?? { col: 0, totalCols: 1 };
                    return <EventBlock key={a.id} appt={a} onSelect={onSelectAppt} isToday={isToday} layoutCol={info.col} layoutCols={info.totalCols ?? 1}/>;
                  });
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Week view (rows = days, cols = doctors) ──────────────────────
function DoctorWeekView({ doctors, appointmentsByDoctorDate, weekDays, selectedDate, onSelectDate, onSelectAppt, filterDoctor }) {
  const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const todayStr  = toDateStr(new Date());
  const visibleDoctors = filterDoctor === 'all' ? doctors : doctors.filter(d => d.id === parseInt(filterDoctor, 10));

  const COL_DAY  = 72;
  const COL_DOC  = 170;
  const gridCols = `${COL_DAY}px repeat(${visibleDoctors.length}, minmax(${COL_DOC}px, 1fr))`;
  const minW     = COL_DAY + visibleDoctors.length * COL_DOC;

  return (
    <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E8EFF8', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* Doctor header */}
      <div style={{ overflowX: 'auto', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, minWidth: minW, background: '#FAFBFD', borderBottom: '1px solid #E8EFF8' }}>
          <div style={{ borderRight: '1px solid #F1F5F9', padding: '11px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#CBD5E1', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Week</span>
          </div>
          {visibleDoctors.map((doc, i) => {
            const bg    = nameColor(`${doc.first_name}${doc.last_name}`);
            const total = weekDays.reduce((sum, d) => sum + ((appointmentsByDoctorDate[`${doc.id}_${d}`] ?? []).length), 0);
            return (
              <div key={doc.id} style={{ padding: '10px 14px', borderRight: i < visibleDoctors.length - 1 ? '1px solid #F1F5F9' : 'none', borderTop: `3px solid ${bg}`, display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: bg + '15', border: `1.5px solid ${bg}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: bg, flexShrink: 0 }}>
                  {(doc.first_name?.[0] ?? '') + (doc.last_name?.[0] ?? '')}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Dr. {doc.first_name} {doc.last_name}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>{total} this week</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day rows */}
      <div style={{ overflowY: 'auto', overflowX: 'auto', flex: 1 }}>
        {weekDays.map((d, di) => {
          const dt         = new Date(d + 'T00:00:00');
          const isToday    = d === todayStr;
          const isSelected = d === selectedDate;
          const isPast     = d < todayStr;
          return (
            <div key={d} style={{ display: 'grid', gridTemplateColumns: gridCols, borderBottom: di < weekDays.length - 1 ? '1px solid #F1F5F9' : 'none', minWidth: minW, background: isToday ? '#F0F9FF' : 'transparent' }}>

              {/* Day label cell */}
              <div onClick={() => onSelectDate(d)}
                style={{ borderRight: `1px solid ${isToday ? '#BAE6FD' : '#F1F5F9'}`, padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 10, cursor: 'pointer', minHeight: 90, background: isToday ? '#E0F2FE' : isSelected ? '#F8FAFF' : '#FAFBFC' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: isToday ? ACCENT : isPast ? '#CBD5E1' : '#94A3B8', letterSpacing: '0.3px', textTransform: 'uppercase' }}>{DAY_SHORT[di]}</span>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: isToday ? ACCENT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: isToday ? '#FFF' : isPast ? '#CBD5E1' : '#0F172A' }}>{dt.getDate()}</span>
                </div>
                {isToday && (
                  <div style={{ marginTop: 5, fontSize: 8, fontWeight: 700, color: '#FFFFFF', background: ACCENT, borderRadius: 20, padding: '2px 6px', letterSpacing: '0.2px' }}>TODAY</div>
                )}
              </div>

              {visibleDoctors.map((doc, ci) => {
                const appts = (appointmentsByDoctorDate[`${doc.id}_${d}`] ?? [])
                  .slice()
                  .sort((a,b) => timeToMins(a.appointment_time) - timeToMins(b.appointment_time));
                const nextSlot = !isPast ? findNextFreeSlot(appts, 20) : null;
                const borderColor = isToday ? '#BAE6FD' : '#F1F5F9';

                return (
                  <div key={doc.id}
                    style={{ borderRight: ci < visibleDoctors.length - 1 ? `1px solid ${borderColor}` : 'none', padding: '7px 8px', minHeight: 90 }}>
                    {appts.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 76, gap: 4 }}>
                        <span style={{ fontSize: 10, color: '#CBD5E1', fontWeight: 500 }}>—</span>
                        {nextSlot && !isPast && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#10B981', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, padding: '2px 7px' }}>
                            Open {fmtTimeShort(nextSlot)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {appts.map(appt => {
                          const st = STATUS[appt.status] ?? STATUS.scheduled;
                          const name = patientFullName(appt);
                          return (
                            <div key={appt.id}
                              onClick={e => { e.stopPropagation(); onSelectAppt(appt, { x: e.clientX, y: e.clientY }); }}
                              style={{ padding: '5px 7px', borderRadius: 0, background: st.bg, borderLeft: `3px solid ${st.dot}`, borderTop: `1px solid ${st.border}`, borderBottom: `1px solid ${st.border}`, borderRight: `1px solid ${st.border}`, cursor: 'pointer' }}
                              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 2px 6px ${st.dot}25`; }}
                              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: st.color, marginBottom: 1 }}>
                                {fmtTimeShort(appt.appointment_time)}
                                <span style={{ fontWeight: 400, color: '#94A3B8' }}> {appt.duration_minutes ?? 15}m</span>
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                            </div>
                          );
                        })}
                        {nextSlot && !isPast && (
                          <div style={{ padding: '3px 7px', border: '1px dashed #BBF7D0', background: '#F0FDF4' }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#10B981' }}>Next: {fmtTimeShort(nextSlot)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────
function ListView({ appointments, token, onRefresh, filterDoctor }) {
  const [popover, setPopover] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const filtered = appointments
    .filter(a => filterDoctor === 'all' || a.doctor_id === parseInt(filterDoctor, 10))
    .filter(a => filterStatus === 'all' || a.status === filterStatus);

  return (
    <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E8EFF8', overflow: 'hidden', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 7, padding: '11px 16px', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', flexShrink: 0 }}>
        {['all', ...Object.keys(STATUS)].map(key => {
          const count = key === 'all' ? appointments.length : appointments.filter(a => a.status === key).length;
          if (key !== 'all' && count === 0) return null;
          const s = key === 'all' ? { label: 'All', color: DARK, bg: '#EFF8FF', border: '#BAE6FD' } : STATUS[key];
          const active = filterStatus === key;
          return (
            <button key={key} onClick={() => setFilterStatus(active ? 'all' : key)}
              style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px', cursor: 'pointer', border: `1px solid ${active ? s.border : '#EEF2F7'}`, background: active ? s.bg : '#F8FAFC', color: active ? s.color : '#94A3B8' }}>
              {count} {s.label}
            </button>
          );
        })}
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 160px 130px 110px 44px', padding: '7px 16px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC' }}>
          {['Time','Patient','Doctor','Type','Status',''].map(h => <div key={h} style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</div>)}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '44px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No appointments</div>
        ) : filtered.map((appt, i, arr) => {
          const s = STATUS[appt.status] ?? STATUS.scheduled;
          return (
            <div key={appt.id} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 160px 130px 110px 44px', padding: '11px 16px', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid #F8FAFC' : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FAFBFF'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{fmtTime(appt.appointment_time)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Avatar appt={appt} size={26}/>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{patientFullName(appt)}</div>
                  {appt.reason && <div style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{appt.reason}</div>}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#475569' }}>Dr. {appt.doctor_last_name}</div>
              <div style={{ fontSize: 12, color: '#475569' }}>{appt.visit_type ?? '—'}</div>
              <span style={{ fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap', display: 'inline-block' }}>{s.label}</span>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={e => setPopover({ appt, anchor: { x: e.clientX, y: e.clientY } })}
                  style={{ background: 'none', border: '1px solid #E2E8F0', cursor: 'pointer', color: '#94A3B8', padding: '4px 6px', borderRadius: 7, display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {popover && <ApptPopover appt={popover.appt} anchor={popover.anchor} token={token} onRefresh={onRefresh} onClose={() => setPopover(null)}/>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────
const VIEWS = [
  { key: 'doctor-day',  label: 'Day', icon: <IcoDoc/> },
  { key: 'doctor-week', label: 'Week', icon: <IcoCal/> },
  { key: 'list',        label: 'List', icon: <IcoList/> },
];

export default function ReceptionistAppointments() {
  const { token } = useAuth();
  const navigate  = useNavigate();

  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [viewMode, setViewMode]         = useState('doctor-day');
  const [filterDoctor, setFilterDoctor] = useState('all'); // 'all' | doctor id string
  const [loading, setLoading]           = useState(true);
  const [popover, setPopover]           = useState(null);

  // Day data
  const [doctors, setDoctors]           = useState([]);
  const [dayAppointments, setDayAppts]  = useState([]);
  const [blockedTime, setBlocked]       = useState([]);

  // Week data
  const [weekDoctors, setWeekDoctors]   = useState([]);
  const [weekAppointments, setWeekAppts] = useState([]);

  // Modals
  const [blockModal, setBlockModal]     = useState(null); // { doctor }
  const [walkInModal, setWalkInModal]   = useState(false);
  const [hoursModal, setHoursModal]     = useState(null); // { doctor }

  const weekDays = getWeekDays(selectedDate);
  const todayStr = toDateStr(new Date());
  const isToday  = selectedDate === todayStr;

  const loadDay = useCallback(async (date) => {
    setLoading(true);
    try {
      const [dr, bl] = await Promise.all([
        getDoctorView(token, date),
        getScheduleBlocked(token, { start: date, end: date }),
      ]);
      setDoctors(dr.data?.data?.doctors ?? []);
      setDayAppts(dr.data?.data?.appointments ?? []);
      setBlocked(bl.data?.data?.blocked ?? []);
    } catch {
      try {
        const r = await getAppointments(token, date);
        setDayAppts(r.data?.data?.appointments ?? []);
      } catch {}
    }
    setLoading(false);
  }, [token]);

  const loadWeek = useCallback(async (start) => {
    setLoading(true);
    try {
      const r = await getDoctorViewWeek(token, start);
      setWeekDoctors(r.data?.data?.doctors ?? []);
      setWeekAppts(r.data?.data?.appointments ?? []);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (viewMode === 'doctor-day' || viewMode === 'list') loadDay(selectedDate);
    else loadWeek(weekDays[0]);
  }, [token, selectedDate, viewMode]);

  const shiftDay  = (n) => { const d = new Date(selectedDate + 'T00:00:00'); d.setDate(d.getDate() + n); setSelectedDate(toDateStr(d)); };
  const shiftWeek = (n) => { const d = new Date(selectedDate + 'T00:00:00'); d.setDate(d.getDate() + n * 7); setSelectedDate(toDateStr(d)); };
  const refresh   = () => viewMode !== 'doctor-week' ? loadDay(selectedDate) : loadWeek(weekDays[0]);

  // Index maps
  const appointmentsByDoctor = doctors.reduce((acc, d) => { acc[d.id] = dayAppointments.filter(a => a.doctor_id === d.id); return acc; }, {});
  const blockedByDoctor = blockedTime.reduce((acc, b) => { if (!acc[b.doctor_id]) acc[b.doctor_id] = []; acc[b.doctor_id].push(b); return acc; }, {});
  const appointmentsByDoctorDate = weekAppointments.reduce((acc, a) => { const k = `${a.doctor_id}_${String(a.appointment_date).slice(0, 10)}`; if (!acc[k]) acc[k] = []; acc[k].push(a); return acc; }, {});

  const weekLabel = (() => {
    const s = new Date(weekDays[0] + 'T00:00:00');
    const e = new Date(weekDays[6] + 'T00:00:00');
    return `${s.toLocaleDateString('en-JM', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-JM', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  })();

  const allDoctors = viewMode === 'doctor-week' ? weekDoctors : doctors;

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', gap: 10 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, flexShrink: 0 }}>

        {/* Date nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <NavBtn onClick={() => viewMode === 'doctor-week' ? shiftWeek(-1) : shiftDay(-1)}><IcoChevL/></NavBtn>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
              {viewMode === 'doctor-week' ? weekLabel : fmtDateLong(selectedDate)}
            </div>
            {viewMode === 'doctor-day' && isToday && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>Today</div>}
          </div>
          <NavBtn onClick={() => viewMode === 'doctor-week' ? shiftWeek(1) : shiftDay(1)}><IcoChevR/></NavBtn>
          {!isToday && viewMode !== 'doctor-week' && (
            <button onClick={() => setSelectedDate(todayStr)} style={{ fontSize: 11, fontWeight: 700, color: ACCENT, background: '#EFF8FF', border: '1px solid #BAE6FD', borderRadius: 20, padding: '3px 11px', cursor: 'pointer' }}>Today</button>
          )}
          <NavBtn onClick={refresh} title="Refresh"><IcoRefresh/></NavBtn>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* Doctor filter */}
          {allDoctors.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', borderRadius: 9, padding: '4px 8px' }}>
              <IcoFilter/>
              <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}
                style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: '#0F172A', outline: 'none', cursor: 'pointer' }}>
                <option value="all">All Doctors</option>
                {allDoctors.map(d => <option key={d.id} value={d.id}>Dr. {d.last_name}</option>)}
              </select>
            </div>
          )}

          {/* View toggle */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 9, padding: 2, gap: 1 }}>
            {VIEWS.map(({ key, label, icon }) => (
              <button key={key} onClick={() => setViewMode(key)} title={label}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: 'none', background: viewMode === key ? '#FFF' : 'transparent', color: viewMode === key ? DARK : '#94A3B8', fontSize: 11, fontWeight: 600, cursor: 'pointer', boxShadow: viewMode === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Walk-in */}
          <button onClick={() => setWalkInModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <IcoWalk/> Walk-In
          </button>

          {/* New appointment */}
          <button onClick={() => navigate('/receptionist/appointments/new')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, background: ACCENT, border: 'none', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 12px ${ACCENT}40` }}>
            <IcoPlus/> New Appointment
          </button>
        </div>
      </div>

      {/* ── Status legend ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        {Object.entries(STATUS).map(([key, s]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot }}/>
            <span style={{ fontSize: 10, color: '#64748B' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', borderRadius: 16, border: '1px solid #E8EFF8' }}>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>Loading…</div>
        </div>
      ) : viewMode === 'doctor-day' ? (
        <DoctorDayView
          doctors={doctors}
          appointmentsByDoctor={appointmentsByDoctor}
          blockedByDoctor={blockedByDoctor}
          selectedDate={selectedDate}
          isToday={isToday}
          onSelectAppt={(a, anchor) => setPopover({ appt: a, anchor })}
          onAddForDoctor={(docId) => navigate(`/receptionist/appointments/new?doctor=${docId}&date=${selectedDate}`)}
          onBlockForDoctor={(doc) => setBlockModal({ doctor: doc })}
          onDeleteBlock={refresh}
          onEditHours={(doc) => setHoursModal({ doctor: doc })}
          token={token}
          filterDoctor={filterDoctor}
        />
      ) : viewMode === 'doctor-week' ? (
        <DoctorWeekView
          doctors={weekDoctors}
          appointmentsByDoctorDate={appointmentsByDoctorDate}
          weekDays={weekDays}
          selectedDate={selectedDate}
          onSelectDate={(d) => { setSelectedDate(d); setViewMode('doctor-day'); }}
          onSelectAppt={(a, anchor) => setPopover({ appt: a, anchor })}
          filterDoctor={filterDoctor}
        />
      ) : (
        <ListView
          appointments={dayAppointments}
          token={token}
          onRefresh={refresh}
          filterDoctor={filterDoctor}
        />
      )}

      {/* Summary strip */}
      {!loading && viewMode !== 'doctor-week' && (
        <div style={{ background: '#FFF', borderRadius: 10, border: '1px solid #E8EFF8', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{fmtDate(selectedDate)} —</span>
          <span style={{ fontSize: 12, color: '#64748B' }}>{dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}</span>
          {Object.entries(STATUS).map(([key, s]) => {
            const count = dayAppointments.filter(a => a.status === key).length;
            if (count === 0) return null;
            return <span key={key} style={{ fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: '2px 8px' }}>{count} {s.label}</span>;
          })}
        </div>
      )}

      {/* Popovers & modals */}
      {popover && <ApptPopover appt={popover.appt} anchor={popover.anchor} token={token} onRefresh={refresh} onClose={() => setPopover(null)}/>}

      {blockModal && (
        <BlockModal
          doctorId={blockModal.doctor.id}
          doctorName={`${blockModal.doctor.first_name} ${blockModal.doctor.last_name}`}
          date={selectedDate}
          token={token}
          onClose={() => setBlockModal(null)}
          onDone={() => { setBlockModal(null); refresh(); }}
        />
      )}

      {walkInModal && (
        <WalkInModal
          doctors={doctors}
          doctorApptsByDoctor={appointmentsByDoctor}
          date={selectedDate}
          token={token}
          onClose={() => setWalkInModal(false)}
        />
      )}

      {hoursModal && (
        <WorkingHoursModal
          doctor={hoursModal.doctor}
          token={token}
          onClose={() => setHoursModal(null)}
          onDone={() => { setHoursModal(null); refresh(); }}
        />
      )}
    </div>
  );
}

function NavBtn({ onClick, children, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: '#FFF', border: `1px solid ${hov ? ACCENT : '#E2E8F0'}`, borderRadius: 9, padding: '7px 9px', cursor: 'pointer', color: hov ? ACCENT : '#64748B', display: 'flex', alignItems: 'center', transition: 'all 0.12s' }}>
      {children}
    </button>
  );
}
