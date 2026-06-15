import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/UndoToast';

const ACCENT = '#0EA5E9';
const DARK   = '#0A2540';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_SCHEDULE = [
  { day: 'Monday',    enabled: true,  start: '08:00', end: '17:00' },
  { day: 'Tuesday',   enabled: true,  start: '08:00', end: '17:00' },
  { day: 'Wednesday', enabled: true,  start: '08:00', end: '17:00' },
  { day: 'Thursday',  enabled: true,  start: '08:00', end: '17:00' },
  { day: 'Friday',    enabled: true,  start: '08:00', end: '16:00' },
  { day: 'Saturday',  enabled: false, start: '09:00', end: '13:00' },
  { day: 'Sunday',    enabled: false, start: '09:00', end: '13:00' },
];

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: value ? ACCENT : '#E2E8F0',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: value ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: '#FFFFFF',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

function TimeSelect({ value, onChange, disabled }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{
        padding: '6px 10px', borderRadius: 8,
        border: `1.5px solid ${disabled ? '#F1F5F9' : '#E2E8F0'}`,
        fontSize: 12, color: disabled ? '#CBD5E1' : '#0F172A',
        background: disabled ? '#FAFBFC' : '#FFFFFF',
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        transition: 'border-color 0.12s',
      }}
      onFocus={e => { if (!disabled) e.target.style.borderColor = ACCENT; }}
      onBlur={e => { e.target.style.borderColor = disabled ? '#F1F5F9' : '#E2E8F0'; }}
    >
      {hours.map(h => {
        const val = `${String(h).padStart(2, '0')}:00`;
        const label = `${h % 12 || 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
        return <option key={h} value={val}>{label}</option>;
      })}
    </select>
  );
}

export default function ReceptionistMySchedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [saved, setSaved] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const update = (dayIdx, field, val) => {
    setSaved(false);
    setSchedule(prev => prev.map((d, i) => i === dayIdx ? { ...d, [field]: val } : d));
  };

  const handleSave = () => {
    setSaved(true);
    toast('Schedule preferences saved — pending admin approval');
  };

  const handleRequest = () => {
    if (!requestNote.trim()) return;
    setSubmitted(true);
    setRequestNote('');
    toast('Schedule change request submitted');
    setTimeout(() => setSubmitted(false), 4000);
  };

  const workingDays = schedule.filter(d => d.enabled).length;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 780, boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>My Schedule</div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Set your preferred working hours. Changes require admin approval.
        </div>
      </div>

      {/* Working summary banner */}
      <div style={{
        background: DARK, borderRadius: 16,
        padding: '18px 22px', marginBottom: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', border: `30px solid ${ACCENT}14`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{user?.first_name} {user?.last_name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>Front Desk · Receptionist</div>
        </div>
        <div style={{ display: 'flex', gap: 20, position: 'relative' }}>
          <Stat label="Days/week" value={workingDays} />
          <Stat label="Status" value="Active" color="#22C55E" />
        </div>
      </div>

      {/* Schedule grid */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8EFF8', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Weekly Hours</div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Toggle days on/off, set hours below</div>
        </div>

        {schedule.map((d, i) => (
          <div key={d.day} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '14px 20px',
            borderBottom: i < schedule.length - 1 ? '1px solid #F8FAFC' : 'none',
            background: d.enabled ? '#FFFFFF' : '#FAFBFC',
            transition: 'background 0.15s',
          }}>
            {/* Day + toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 140 }}>
              <Toggle value={d.enabled} onChange={val => update(i, 'enabled', val)} />
              <span style={{ fontSize: 13, fontWeight: d.enabled ? 600 : 400, color: d.enabled ? '#0F172A' : '#94A3B8', transition: 'color 0.15s' }}>
                {d.day}
              </span>
            </div>

            {/* Time selectors */}
            {d.enabled ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TimeSelect value={d.start} onChange={val => update(i, 'start', val)} disabled={!d.enabled} />
                <span style={{ fontSize: 12, color: '#CBD5E1' }}>to</span>
                <TimeSelect value={d.end} onChange={val => update(i, 'end', val)} disabled={!d.enabled} />
                <span style={{ fontSize: 11, color: '#94A3B8' }}>
                  ({calcHours(d.start, d.end)} hrs)
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 12, color: '#CBD5E1', fontStyle: 'italic' }}>Not working this day</span>
            )}
          </div>
        ))}
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: saved ? '#10B981' : ACCENT, color: '#FFFFFF',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: `0 4px 12px ${saved ? '#10B98140' : `${ACCENT}40`}`,
            transition: 'background 0.2s, box-shadow 0.2s',
          }}
        >
          {saved ? 'Saved' : 'Save Preferences'}
        </button>
      </div>

      {/* Change request */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8EFF8', padding: '20px 22px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Request a Schedule Change</div>
        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 1.6 }}>
          Need a specific change that the form above doesn't cover? Send a note to the admin directly.
        </div>
        <textarea
          value={requestNote}
          onChange={e => setRequestNote(e.target.value)}
          placeholder="e.g. I need to leave at 3 PM on Thursdays for the next 4 weeks due to a medical appointment."
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 13px', borderRadius: 10,
            border: '1.5px solid #E2E8F0',
            fontSize: 13, color: '#0F172A',
            lineHeight: 1.6, resize: 'vertical',
            outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.12s',
          }}
          onFocus={e => { e.target.style.borderColor = ACCENT; }}
          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>
            Your message will be sent to the admin for review.
          </span>
          <button
            onClick={handleRequest}
            disabled={!requestNote.trim()}
            style={{
              padding: '9px 20px', borderRadius: 9, border: 'none',
              background: requestNote.trim() ? DARK : '#F1F5F9',
              color: requestNote.trim() ? '#FFFFFF' : '#CBD5E1',
              fontSize: 13, fontWeight: 600,
              cursor: requestNote.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.14s',
            }}
          >
            {submitted ? 'Sent!' : 'Submit Request'}
          </button>
        </div>
      </div>

      {/* Hours info */}
      <div style={{ marginTop: 16, padding: '12px 16px', background: '#EFF8FF', borderRadius: 10, border: '1px solid #BAE6FD' }}>
        <div style={{ fontSize: 12, color: '#0369A1', lineHeight: 1.6 }}>
          <strong>Note:</strong> Schedule preferences are reviewed by an administrator before taking effect. Your current contracted hours remain active until a change is approved.
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: color ?? '#FFFFFF', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{label}</div>
    </div>
  );
}

function calcHours(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? (diff / 60).toFixed(1).replace('.0', '') : 0;
}
