import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPatient } from '../../api/patients';
import { getPatientAppointments, getPatientVisits, getPatientPrescriptions } from '../../api/appointments';

// ─── Icons ────────────────────────────────────────────────────────
const Ico = ({ d, size = 14 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const IcoBack    = () => <Ico d="M15 19l-7-7 7-7" />;
const IcoCal     = () => <Ico d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />;
const IcoPhone   = () => <Ico size={12} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />;
const IcoMail    = () => <Ico size={12} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
const IcoDOB     = () => <Ico size={12} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />;
const IcoFlask   = () => <Ico size={12} d="M9 3h6m-6 0H7a1 1 0 00-1 1v2.172a2 2 0 00.586 1.414l4.828 4.828A2 2 0 0112 14v5m0-5v5m0 0h1a1 1 0 001-1v-1a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1h1"/>;
const IcoImg     = () => <Ico size={12} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>;
const IcoHeart   = () => <Ico size={12} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>;
const IcoDoc     = () => <Ico size={12} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>;
const IcoFollow  = () => <Ico size={12} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>;

const ACCENT = '#0EA5E9';
const DARK   = '#0A2540';

const AVATAR_COLORS = [
  ['#1E3A5F', '#FFFFFF'],
  ['#134E4A', '#FFFFFF'],
  ['#4C1D95', '#FFFFFF'],
  ['#7F1D1D', '#FFFFFF'],
  ['#1E3A5F', '#FFFFFF'],
];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const STATUS_STYLES = {
  scheduled:  { bg: '#F8FAFC', color: '#0369A1', border: '#BAE6FD', label: 'Scheduled' },
  checked_in: { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', label: 'Checked In' },
  triage:     { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', label: 'Checked In' },
  waiting:    { bg: '#EDE9FE', color: '#5B21B6', border: '#DDD6FE', label: 'Waiting' },
  completed:  { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0', label: 'Completed' },
  cancelled:  { bg: '#FFF1F2', color: '#E11D48', border: '#FECDD3', label: 'Cancelled' },
  no_show:    { bg: '#FFF7ED', color: '#D97706', border: '#FED7AA', label: 'No Show' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-JM', { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}
function age(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}
function cap(s) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}
function docColorFor(firstName, lastName) {
  const AV = ['#0EA5E9','#10B981','#8B5CF6','#F59E0B','#EF4444','#06B6D4','#EC4899'];
  const s = `${firstName}${lastName}`;
  let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return AV[Math.abs(h) % AV.length];
}

// ─── Field ────────────────────────────────────────────────────────
function Field({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#1E293B', fontWeight: 600, fontFamily: mono ? 'monospace' : 'inherit', letterSpacing: mono ? '0.3px' : undefined, wordBreak: 'break-word' }}>{value || '—'}</div>
    </div>
  );
}

function SectionHead({ label }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 20 }}>{label}</div>;
}

// ─── Vital chip ───────────────────────────────────────────────────
function VitalChip({ label, value, unit }) {
  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 68 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: DARK, marginTop: 2 }}>{value}</div>
      {unit && <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 1 }}>{unit}</div>}
    </div>
  );
}

// ─── Visit card ───────────────────────────────────────────────────
function VisitCard({ visit }) {
  const [open, setOpen] = useState(false);
  const hasDiagnosis = visit.diagnosis || visit.secondary_diagnoses;
  const hasTreatment = visit.treatment_plan;
  const hasVitals    = visit.bp_systolic || visit.pulse_bpm || visit.temperature_celsius || visit.oxygen_saturation || visit.weight_kg;
  const hasLabs      = visit.lab_count > 0;
  const hasImaging   = visit.imaging_count > 0;
  const hasNotes     = visit.clinical_notes_summary || visit.clinical_notes_raw;
  const color        = docColorFor(visit.doctor_first_name, visit.doctor_last_name);

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #F1F5F9', overflow: 'hidden', marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ minWidth: 52, textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: DARK, lineHeight: 1 }}>{new Date(visit.visit_date).getDate()}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 1 }}>
            {new Date(visit.visit_date).toLocaleDateString('en-JM', { month: 'short', year: '2-digit' })}
          </div>
        </div>
        <div style={{ width: 1, height: 40, background: '#F1F5F9', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: color + '18', border: `1.5px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: color, flexShrink: 0 }}>
              {(visit.doctor_first_name?.[0] ?? '') + (visit.doctor_last_name?.[0] ?? '')}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Dr. {visit.doctor_first_name} {visit.doctor_last_name}</span>
            {visit.doctor_designation && <span style={{ fontSize: 10, color: '#94A3B8' }}>· {visit.doctor_designation}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {visit.visit_type && <span style={{ fontSize: 10, color: '#64748B', background: '#F8FAFC', borderRadius: 4, padding: '1px 6px', border: '1px solid #F1F5F9' }}>{visit.visit_type}</span>}
            {visit.presenting_complaint && (
              <span style={{ fontSize: 10, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                {visit.presenting_complaint.charAt(0).toUpperCase() + visit.presenting_complaint.slice(1)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, flexWrap: 'nowrap' }}>
          {hasDiagnosis && (
            <span title="Diagnosis" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#475569', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 5, padding: '2px 6px' }}>
              <IcoDoc /> Dx
            </span>
          )}
          {hasLabs && (
            <span title={visit.lab_tests} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#059669', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 5, padding: '2px 6px' }}>
              <IcoFlask /> {visit.lab_count} Lab{visit.lab_count > 1 ? 's' : ''}
            </span>
          )}
          {hasImaging && (
            <span title={visit.imaging_tests} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#7C3AED', background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 5, padding: '2px 6px' }}>
              <IcoImg /> {visit.imaging_count} Img
            </span>
          )}
          {visit.follow_up_required && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 5, padding: '2px 6px' }}>
              <IcoFollow /> Follow-up
            </span>
          )}
          <span style={{ fontSize: 9, fontWeight: 700, background: visit.status === 'completed' ? '#F0FDF4' : '#F8FAFC', color: visit.status === 'completed' ? '#15803D' : '#64748B', border: `1px solid ${visit.status === 'completed' ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: 20, padding: '2px 7px' }}>
            {cap(visit.status)}
          </span>
        </div>
        <div style={{ color: open ? ACCENT : '#CBD5E1', transition: 'transform 0.15s, color 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {hasVitals && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Vitals</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {visit.bp_systolic && visit.bp_diastolic && <VitalChip label="BP" value={`${visit.bp_systolic}/${visit.bp_diastolic}`} unit="mmHg"/>}
                {visit.pulse_bpm && <VitalChip label="Pulse" value={visit.pulse_bpm} unit="bpm"/>}
                {visit.temperature_celsius && <VitalChip label="Temp" value={visit.temperature_celsius} unit="°C"/>}
                {visit.oxygen_saturation && <VitalChip label="SpO2" value={`${visit.oxygen_saturation}%`}/>}
                {visit.weight_kg && <VitalChip label="Weight" value={visit.weight_kg} unit="kg"/>}
              </div>
            </div>
          )}
          {hasDiagnosis && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Diagnosis</div>
              {visit.diagnosis && <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{visit.diagnosis}</div>}
              {visit.secondary_diagnoses && <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{visit.secondary_diagnoses}</div>}
            </div>
          )}
          {hasTreatment && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Treatment Plan</div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{visit.treatment_plan}</div>
            </div>
          )}
          {hasNotes && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Clinical Notes</div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, background: '#F8FAFC', borderRadius: 8, padding: '10px 12px', whiteSpace: 'pre-wrap' }}>
                {visit.clinical_notes_summary || visit.clinical_notes_raw}
              </div>
            </div>
          )}
          {(hasLabs || hasImaging) && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Tests Ordered</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {hasLabs && visit.lab_tests && visit.lab_tests.split(', ').map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#334155' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', flexShrink: 0 }}/>
                    {t} <span style={{ fontSize: 10, color: '#94A3B8' }}>(Lab)</span>
                  </div>
                ))}
                {hasImaging && visit.imaging_tests && visit.imaging_tests.split(', ').map((t, i) => (
                  <div key={`img${i}`} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#334155' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED', flexShrink: 0 }}/>
                    {t} <span style={{ fontSize: 10, color: '#94A3B8' }}>(Imaging)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {visit.follow_up_required && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 12px' }}>
              <IcoFollow />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>
                Follow-up required{visit.follow_up_date ? ` — ${fmtDate(visit.follow_up_date)}` : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Prescription row ─────────────────────────────────────────────
function PrescriptionRow({ rx, index, total }) {
  const isActive = rx.status === 'active';
  const color = docColorFor(rx.doctor_first_name, rx.doctor_last_name);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 100px 100px 110px', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: index < total - 1 ? '1px solid #F8FAFC' : 'none' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#FAFBFC'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{rx.drug_name}</div>
        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
          {[rx.dosage, rx.route, rx.frequency].filter(Boolean).join(' · ')}
          {rx.duration_days ? ` · ${rx.duration_days} days` : ''}
        </div>
        {rx.instructions && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, fontStyle: 'italic' }}>{rx.instructions}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: color + '18', border: `1.5px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: color, flexShrink: 0 }}>
          {(rx.doctor_first_name?.[0] ?? '') + (rx.doctor_last_name?.[0] ?? '')}
        </div>
        <span style={{ fontSize: 12, color: '#475569' }}>Dr. {rx.doctor_last_name}</span>
      </div>
      <div style={{ fontSize: 12, color: '#475569' }}>{fmtDate(rx.visit_date)}</div>
      <div style={{ fontSize: 12, color: '#64748B' }}>{rx.quantity ? `Qty ${rx.quantity}` : '—'}</div>
      <span style={{
        display: 'inline-block', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 9px',
        background: rx.nhf_covered ? '#F0FDF4' : '#F8FAFC',
        color: rx.nhf_covered ? '#15803D' : '#64748B',
        border: `1px solid ${rx.nhf_covered ? '#BBF7D0' : '#E2E8F0'}`,
      }}>
        {rx.nhf_covered ? 'Yes' : 'No'}
      </span>
      <span style={{
        display: 'inline-block', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 9px',
        background: isActive ? '#F0FDF4' : '#F8FAFC',
        color: isActive ? '#15803D' : '#64748B',
        border: `1px solid ${isActive ? '#BBF7D0' : '#E2E8F0'}`,
      }}>
        {isActive ? 'Active' : 'Completed'}
      </span>
    </div>
  );
}

// ─── Appointments tab with sorted sections ─────────────────────────
function AppointmentsTab({ appointments }) {
  if (appointments.length === 0) {
    return (
      <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #F1F5F9', padding: '52px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>No appointments</div>
        <div style={{ fontSize: 12, color: '#94A3B8' }}>This patient has no recorded appointments.</div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = appointments
    .filter(a => new Date(a.appointment_date) >= today)
    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

  const past = appointments
    .filter(a => new Date(a.appointment_date) < today)
    .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

  const colHeaders = ['#', 'Date', 'Doctor', 'Type', 'Booked By', 'Status', 'Time'];
  const colTemplate = '44px 120px 1fr 140px 140px 100px 80px';

  const renderRow = (appt, i, list) => {
    const s = STATUS_STYLES[appt.status] ?? STATUS_STYLES.scheduled;
    const color = docColorFor(appt.doctor_first_name, appt.doctor_last_name);
    const bookerName = appt.booked_by_first_name
      ? `${appt.booked_by_first_name} ${appt.booked_by_last_name ?? ''}`.trim()
      : '—';
    const bookerNum = appt.booked_by
      ? `SEDA-S${String(appt.booked_by).padStart(3, '0')}`
      : null;
    return (
      <div key={appt.id}
        style={{ display: 'grid', gridTemplateColumns: colTemplate, padding: '12px 20px', alignItems: 'center', borderBottom: i < list.length - 1 ? '1px solid #F8FAFC' : 'none' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#FAFBFC'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#CBD5E1', fontFamily: 'monospace' }}>#{appt.id}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: DARK }}>{fmtDate(appt.appointment_date)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: color + '18', border: `1.5px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: color, flexShrink: 0 }}>
            {(appt.doctor_first_name?.[0] ?? '') + (appt.doctor_last_name?.[0] ?? '')}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Dr. {appt.doctor_first_name} {appt.doctor_last_name}</div>
            {appt.reason && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.reason.charAt(0).toUpperCase() + appt.reason.slice(1)}</div>}
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.visit_type ?? '—'}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bookerName}</div>
          {bookerNum && <span style={{ fontSize: 9, fontWeight: 700, background: '#F1F5F9', color: '#475569', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace', letterSpacing: '0.3px', marginTop: 2, display: 'inline-block' }}>{bookerNum}</span>}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: '2px 9px', display: 'inline-block', whiteSpace: 'nowrap' }}>{s.label}</span>
        <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT }}>{fmtTime(appt.appointment_time)}</div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {upcoming.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
            Upcoming — {upcoming.length}
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: colTemplate, padding: '9px 20px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC' }}>
              {colHeaders.map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
              ))}
            </div>
            {upcoming.map((appt, i) => renderRow(appt, i, upcoming))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
            Past — {past.length}
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: colTemplate, padding: '9px 20px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC' }}>
              {colHeaders.map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
              ))}
            </div>
            {past.map((appt, i) => renderRow(appt, i, past))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
export default function ReceptionistPatientProfile() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient]             = useState(null);
  const [visits, setVisits]               = useState([]);
  const [appointments, setAppts]          = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('info');

  useEffect(() => {
    if (!token || !id) return;
    getPatient(id, token)
      .then(r => { if (r.data?.data?.patient) setPatient(r.data.data.patient); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, id]);

  useEffect(() => {
    if (activeTab !== 'visits' || !token) return;
    getPatientVisits(id, token)
      .then(r => setVisits(r.data?.data?.visits ?? []))
      .catch(() => {});
  }, [activeTab, token, id]);

  useEffect(() => {
    if (activeTab !== 'appointments' || !token) return;
    getPatientAppointments(id, token)
      .then(r => setAppts(r.data?.data?.appointments ?? []))
      .catch(() => {});
  }, [activeTab, token, id]);

  useEffect(() => {
    if (activeTab !== 'prescriptions' || !token) return;
    getPatientPrescriptions(id, token)
      .then(r => setPrescriptions(r.data?.data?.prescriptions ?? []))
      .catch(() => {});
  }, [activeTab, token, id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ fontSize: 13, color: '#94A3B8' }}>Loading patient…</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ fontSize: 13, color: '#E11D48', marginBottom: 12 }}>Patient not found.</div>
        <button onClick={() => navigate('/receptionist/patients')} style={{ padding: '8px 16px', borderRadius: 8, background: DARK, border: 'none', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Back to patients
        </button>
      </div>
    );
  }

  const name = `${patient.first_name}${patient.middle_name ? ' ' + patient.middle_name : ''} ${patient.last_name}`;
  const [avatarBg, avatarFg] = avatarColor(name);
  const initials = (patient.first_name?.[0] ?? '') + (patient.last_name?.[0] ?? '');
  const patientAge = age(patient.date_of_birth);

  const tabs = [
    { key: 'info',          label: 'Patient Info' },
    { key: 'visits',        label: 'Visit History' },
    { key: 'appointments',  label: 'Appointments' },
    { key: 'prescriptions', label: 'Prescriptions' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F5F7FA' }}>

      {/* ── Scrollable outer area ──────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 32px' }}>

        {/* Back link */}
        <button
          onClick={() => navigate('/receptionist/patients')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12, padding: 0, marginBottom: 16 }}
          onMouseEnter={e => { e.currentTarget.style.color = DARK; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; }}
        >
          <IcoBack /> Patients
        </button>

        {/* ── Hero header card ────────────────────────────────── */}
        <div style={{ background: DARK, borderRadius: 18, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '24px 28px 0' }}>

            {/* Top row: avatar + name + book button */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, paddingBottom: 16 }}>

              {/* Avatar with ring */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: avatarBg, color: avatarFg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 800, flexShrink: 0,
                boxShadow: '0 0 0 3px rgba(255,255,255,0.15)',
              }}>
                {initials.toUpperCase()}
              </div>

              {/* Name + badges */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px', marginBottom: 10, wordBreak: 'break-word', lineHeight: 1.2 }}>{name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center', marginBottom: 12 }}>
                  {patient.patient_number && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, padding: '2px 9px', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                      {patient.patient_number}
                    </span>
                  )}
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: patient.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                    color: patient.status === 'active' ? '#34D399' : '#FCD34D',
                    borderRadius: 20, padding: '3px 10px',
                    border: `1px solid ${patient.status === 'active' ? 'rgba(52,211,153,0.3)' : 'rgba(252,211,77,0.3)'}`,
                  }}>
                    {patient.status === 'active' ? 'Active' : 'Pending Review'}
                  </span>
                  {patient.blood_type && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.2)', color: '#FCA5A5', borderRadius: 5, padding: '2px 8px', border: '1px solid rgba(252,165,165,0.3)' }}>
                      {patient.blood_type}
                    </span>
                  )}
                  {patient.allergies_summary && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#FCA5A5', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 5, padding: '2px 8px' }}>
                      <IcoHeart /> Allergy: {patient.allergies_summary}
                    </span>
                  )}
                </div>

                {/* Contact summary bar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
                  {patient.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      <IcoPhone />{patient.phone}
                    </div>
                  )}
                  {patient.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      <IcoMail />{patient.email}
                    </div>
                  )}
                  {patient.date_of_birth && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      <IcoDOB />{fmtDate(patient.date_of_birth)}{patientAge !== null ? ` · ${patientAge} yrs` : ''}
                      {patient.sex ? ` · ${cap(patient.sex)}` : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Book appointment button */}
              <button
                onClick={() => navigate('/receptionist/appointments/new?patient=' + id)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, background: ACCENT, border: 'none', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', marginTop: 4 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#0284C7'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ACCENT; }}
              >
                <IcoCal /> Book Appointment
              </button>
            </div>
          </div>

          {/* Tab bar flush at base of card */}
          <div style={{ display: 'flex', paddingLeft: 28, borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 4 }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 20px',
                  background: 'none', border: 'none',
                  borderBottom: activeTab === tab.key ? `2px solid ${ACCENT}` : '2px solid transparent',
                  cursor: 'pointer', fontSize: 13,
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  color: activeTab === tab.key ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.12s', whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ─────────────────────────────────────── */}
        <div>

          {/* ── Tab: Patient Info ── */}
          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

              {/* Contact */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #F1F5F9', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <SectionHead label="Contact" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
                  <Field label="Phone" value={patient.phone} />
                  <Field label="Secondary Phone" value={patient.phone_secondary} />
                  <Field label="Email" value={patient.email} />
                  <Field label="Preferred Contact" value={cap(patient.preferred_contact)} />
                  <Field label="Address" value={patient.address} />
                  <Field label="Parish" value={patient.parish} />
                </div>
              </div>

              {/* Personal Details */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #F1F5F9', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <SectionHead label="Personal Details" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
                  <Field label="Date of Birth" value={fmtDate(patient.date_of_birth)} />
                  <Field label="Age" value={patientAge !== null ? `${patientAge} years` : null} />
                  <Field label="Sex" value={cap(patient.sex)} />
                  <Field label="Marital Status" value={cap(patient.marital_status)} />
                  <Field label="Occupation" value={patient.occupation} />
                  <Field label="National ID" value={patient.national_id} mono />
                  <Field label="TRN" value={patient.trn} mono />
                </div>
              </div>

              {/* Medical Information */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #F1F5F9', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <SectionHead label="Medical Information" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
                  <Field label="Blood Type" value={patient.blood_type} />
                  <Field label="Allergies" value={patient.allergies_summary} />
                  <Field label="Insurance Provider" value={patient.insurance_provider} />
                  <Field label="NHF Card Number" value={patient.nhf_card_number} mono />
                </div>
              </div>

              {/* Emergency Contact */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #F1F5F9', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <SectionHead label="Emergency Contact" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
                  <Field label="Name" value={patient.emergency_contact_name} />
                  <Field label="Relationship" value={patient.emergency_contact_relation} />
                  <Field label="Phone" value={patient.emergency_contact_phone} />
                </div>
              </div>

              {/* Registration */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #F1F5F9', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <SectionHead label="Registration" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
                  <Field label="Source" value={cap(patient.registration_source)} />
                  <Field label="Consent Given" value={patient.consent_given ? 'Yes' : 'No'} />
                  <Field label="Consent Date" value={fmtDate(patient.consent_date)} />
                  <Field label="Registered" value={fmtDate(patient.created_at)} />
                </div>
              </div>

            </div>
          )}

          {/* ── Tab: Visit History ── */}
          {activeTab === 'visits' && (
            <div>
              {visits.length === 0 ? (
                <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #F1F5F9', padding: '52px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>No visit history</div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>Visits are recorded when a patient checks in for an appointment.</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>{visits.length} visit{visits.length !== 1 ? 's' : ''} on record</div>
                  {visits.map(v => <VisitCard key={v.id} visit={v} />)}
                </>
              )}
            </div>
          )}

          {/* ── Tab: Appointments ── */}
          {activeTab === 'appointments' && (
            <AppointmentsTab appointments={appointments} />
          )}

          {/* ── Tab: Prescriptions ── */}
          {activeTab === 'prescriptions' && (
            <div>
              {prescriptions.length === 0 ? (
                <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #F1F5F9', padding: '52px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>No prescriptions on file</div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>Prescriptions are added by the attending doctor during a visit.</div>
                </div>
              ) : (
                <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 100px 100px 110px', padding: '9px 20px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC' }}>
                    {['Medication', 'Doctor', 'Visit Date', 'Qty', 'NHF', 'Status'].map(h => (
                      <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
                    ))}
                  </div>
                  {prescriptions.map((rx, i) => (
                    <PrescriptionRow key={rx.id} rx={rx} index={i} total={prescriptions.length} />
                  ))}
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 11, color: '#94A3B8', textAlign: 'right' }}>
                {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''} on record
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
