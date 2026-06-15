import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookAppointment, getPatientVisits } from '../../api/appointments';
import { getDoctors } from '../../api/staff';
import { searchPatients, getPatient, registerPatient } from '../../api/patients';

const ACCENT = '#0EA5E9';
const DARK   = '#0A2540';
const APPT_DARK = '#0D3B5E'; // deep teal-blue — distinct from patients navy

function IconSearch() {
  return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>;
}
function IconNewPat() {
  return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
}
function IconBack() {
  return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
}
function IconSparkle() {
  return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
}
function IconAlert() {
  return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
}

function FormGroup({ label, required, children, hint, error }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#E11D48', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && !error && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{hint}</div>}
      {error && <div style={{ fontSize: 11, color: '#E11D48', marginTop: 4 }}>{error}</div>}
    </div>
  );
}

const inputBase = {
  width: '100%', padding: '10px 12px', borderRadius: 9,
  fontSize: 13, color: '#0F172A', outline: 'none',
  background: '#FFFFFF', boxSizing: 'border-box',
  transition: 'border-color 0.14s, box-shadow 0.14s',
  fontFamily: 'inherit',
};
function inputStyle(focused, err) {
  return {
    ...inputBase,
    border: `1.5px solid ${err ? '#FECDD3' : focused ? ACCENT : '#E2E8F0'}`,
    boxShadow: focused ? `0 0 0 3px ${ACCENT}18` : 'none',
  };
}

function Input({ value, onChange, type = 'text', placeholder, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={inputStyle(focused)} {...rest} />
  );
}

function Select({ value, onChange, children, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <select value={value} onChange={onChange} disabled={disabled}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...inputStyle(focused), cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1 }}>
      {children}
    </select>
  );
}

function fmtDOB(dob) {
  if (!dob) return null;
  return new Date(dob).toLocaleDateString('en-JM', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Patient search with DOB ──────────────────────────────────────
function PatientSearch({ token, onSelect, prePatient }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(prePatient ?? null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Apply pre-selected patient when it arrives
  useEffect(() => {
    if (prePatient && !selected) {
      setSelected(prePatient);
      setQ(`${prePatient.first_name} ${prePatient.last_name}`);
      onSelect(prePatient);
    }
  }, [prePatient]);

  useEffect(() => {
    if (!q.trim() || selected) { setResults([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      searchPatients(q, token)
        .then(r => {
          const patients = r.data?.data?.patients ?? [];
          setResults(patients);
          setOpen(patients.length > 0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [q, token, selected]);

  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (p) => {
    setSelected(p);
    setQ(`${p.first_name} ${p.last_name}`);
    setOpen(false);
    onSelect(p);
  };
  const clear = () => { setSelected(null); setQ(''); onSelect(null); };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {!selected ? (
        <>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 11, color: '#94A3B8', display: 'flex', pointerEvents: 'none' }}><IconSearch /></span>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by name, ID, or phone…"
              style={{ ...inputStyle(false), paddingLeft: 34 }}
            />
          </div>
          {loading && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#94A3B8', zIndex: 50 }}>Searching…</div>
          )}
          {open && results.length > 0 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }}>
              {results.slice(0, 8).map((p, i) => (
                <div key={p.id} onClick={() => pick(p)}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: i < Math.min(results.length, 8) - 1 ? '1px solid #F8FAFC' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#475569', flexShrink: 0 }}>
                    {p.first_name?.charAt(0)}{p.last_name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                      {p.first_name} {p.middle_name ? p.middle_name + ' ' : ''}{p.last_name}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                      {p.patient_number ?? '—'}
                      {p.date_of_birth && <span> · {fmtDOB(p.date_of_birth)}</span>}
                      {p.phone && <span> · {p.phone}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Selected state — clean card, no "Selected" label */
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 9 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#475569', flexShrink: 0 }}>
            {selected.first_name?.charAt(0)}{selected.last_name?.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              {selected.first_name} {selected.middle_name ? selected.middle_name + ' ' : ''}{selected.last_name}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
              {selected.patient_number ?? '—'}
              {selected.date_of_birth && <span> · {fmtDOB(selected.date_of_birth)}</span>}
            </div>
          </div>
          <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 18, lineHeight: 1, padding: '2px 4px', borderRadius: 5 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#475569'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; }}>×</button>
        </div>
      )}
    </div>
  );
}

// ─── New Patient mini-form ─────────────────────────────────────────
function NewPatientForm({ token, onCreated, onCancel }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [dob, setDob]             = useState('');
  const [sex, setSex]             = useState('');
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');

  const submit = async () => {
    if (!firstName || !lastName) { setErr('First and last name are required'); return; }
    setSaving(true); setErr('');
    try {
      const res = await registerPatient({
        first_name: firstName, last_name: lastName,
        phone: phone || null, date_of_birth: dob || null,
        sex: sex || null, registration_source: 'staff',
        status: 'active', consent_given: true,
        consent_date: new Date().toISOString().slice(0, 10),
      }, token);
      const patient = res.data?.data?.patient;
      if (patient) onCreated(patient);
    } catch (e) {
      setErr(e.response?.data?.message ?? 'Failed to create patient');
      setSaving(false);
    }
  };

  const miniInput = {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: '1.5px solid #E2E8F0', fontSize: 12, color: '#0F172A',
    outline: 'none', boxSizing: 'border-box', background: '#FFF',
  };

  return (
    <div style={{ marginTop: 10, padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
        <IconNewPat /> Quick Register New Patient
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>First Name <span style={{ color: '#E11D48' }}>*</span></label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Jordan" style={miniInput}
            onFocus={e => { e.target.style.borderColor = ACCENT; }} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Last Name <span style={{ color: '#E11D48' }}>*</span></label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Smith" style={miniInput}
            onFocus={e => { e.target.style.borderColor = ACCENT; }} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="876-xxx-xxxx" style={miniInput}
            onFocus={e => { e.target.style.borderColor = ACCENT; }} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Date of Birth</label>
          <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={miniInput}
            onFocus={e => { e.target.style.borderColor = ACCENT; }} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Sex</label>
          <select value={sex} onChange={e => setSex(e.target.value)} style={{ ...miniInput, cursor: 'pointer' }}>
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#64748B', marginBottom: 10, padding: '7px 10px', background: '#F1F5F9', borderRadius: 7 }}>
        Creates an active patient record. Remaining details can be completed from the patient profile later.
      </div>
      {err && <div style={{ fontSize: 11, color: '#E11D48', marginBottom: 10 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button onClick={submit} disabled={saving} style={{ flex: 2, padding: '8px 0', borderRadius: 8, border: 'none', background: saving ? '#94A3B8' : DARK, color: '#FFF', fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
          {saving ? 'Creating…' : 'Create and Continue'}
        </button>
      </div>
    </div>
  );
}

const VISIT_TYPES = [
  'General Consultation', 'Follow-Up', 'Urgent Care', 'Pediatric Visit',
  'Prenatal', 'Vaccination', 'Lab Results Review', 'Physical Examination', 'Specialist Referral',
];
const DURATIONS = [15, 20, 30, 45, 60];

export default function ReceptionistNewAppointment() {
  const { token, user } = useAuth();
  const staffNumber = user ? `SEDA-S${String(user.id).padStart(3, '0')}` : '—';
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();

  const preDoctor    = searchParams.get('doctor')  ?? '';
  const preDate      = searchParams.get('date')    ?? new Date().toISOString().slice(0, 10);
  const prePatientId = searchParams.get('patient') ?? '';
  const isWalkIn     = searchParams.get('walkIn')  === '1';

  const [doctors, setDoctors]       = useState([]);
  const [prePatient, setPrePatient] = useState(null); // loaded from ?patient= param
  const [patientMode, setPatientMode] = useState('existing');
  const [patientId, setPatientId]   = useState(null);
  const [patientLabel, setPatientLabel] = useState('');
  const [doctorId, setDoctorId]     = useState(preDoctor);
  const [date, setDate]             = useState(preDate);
  const [time, setTime]             = useState('09:00');
  const [visitType, setVisitType]   = useState('');
  const [duration, setDuration]     = useState(30);
  const [reason, setReason]         = useState('');
  const [notes, setNotes]           = useState('');

  const [autofill, setAutofill]     = useState(null);
  const [loadingVisits, setLoadingVisits] = useState(false);

  const [saving, setSaving]         = useState(false);
  const [errors, setErrors]         = useState({});
  const [apiErr, setApiErr]         = useState('');
  const [isConflict, setIsConflict] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    getDoctors(token).then(r => setDoctors(r.data?.data?.doctors ?? [])).catch(() => {});
  }, [token]);

  // Load pre-selected patient from ?patient= query param
  useEffect(() => {
    if (!prePatientId || !token) return;
    getPatient(prePatientId, token)
      .then(r => {
        const p = r.data?.data?.patient;
        if (p) { setPrePatient(p); setPatientId(p.id); }
      })
      .catch(() => {});
  }, [prePatientId, token]);

  const handlePatientSelect = async (patient) => {
    if (!patient) { setPatientId(null); setAutofill(null); return; }
    setPatientId(patient.id);
    setAutofill(null);
    setLoadingVisits(true);
    try {
      const r = await getPatientVisits(patient.id, token);
      const visits = r.data?.data?.visits ?? [];
      if (visits.length > 0) {
        const last = visits[0];
        if (last.follow_up_required || last.follow_up_date) {
          setAutofill({
            followUpDate: last.follow_up_date,
            followUpNotes: last.treatment_plan ? `Follow-up: ${last.treatment_plan.slice(0, 80)}${last.treatment_plan.length > 80 ? '…' : ''}` : null,
            suggestedReason: last.treatment_plan ? `Follow-up: ${last.treatment_plan.slice(0, 60)}` : 'Follow-Up Visit',
            suggestedType: 'Follow-Up',
            doctorName: last.doctor_last_name ? `${last.doctor_first_name ?? ''} ${last.doctor_last_name}`.trim() : null,
          });
        }
      }
    } catch {}
    setLoadingVisits(false);
  };

  const applyAutofill = () => {
    if (!autofill) return;
    if (autofill.suggestedReason) setReason(autofill.suggestedReason);
    if (autofill.suggestedType)   setVisitType(autofill.suggestedType);
    if (autofill.followUpDate)    setDate(autofill.followUpDate);
  };

  const validate = () => {
    const e = {};
    if (!patientId) e.patient   = 'Select a patient';
    if (!doctorId)  e.doctor    = 'Select a doctor';
    if (!date)      e.date      = 'Date is required';
    if (!time)      e.time      = 'Time is required';
    if (!visitType) e.visitType = 'Select a visit type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true); setApiErr(''); setIsConflict(false); setSuccessMsg('');
    try {
      await bookAppointment({
        patient_id: patientId,
        doctor_id: parseInt(doctorId, 10),
        appointment_date: date,
        appointment_time: time,
        duration_minutes: duration,
        visit_type: visitType,
        reason: reason || null,
        notes: notes || null,
      }, token);
      setSuccessMsg('Appointment booked.');
      setTimeout(() => navigate('/receptionist/appointments'), 1100);
    } catch (e) {
      const msg = e.response?.data?.message ?? 'Failed to book appointment';
      const is409 = e.response?.status === 409;
      setApiErr(msg);
      setIsConflict(is409);
    } finally {
      setSaving(false);
    }
  };

  const selectedDoctor = doctors.find(d => String(d.id) === String(doctorId));

  const SectionLabel = ({ children }) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>{children}</div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Page banner — deep teal-blue, distinct from patients navy ── */}
      <div style={{ background: APPT_DARK, padding: '20px 28px 0', flexShrink: 0 }}>
        <button onClick={() => navigate('/receptionist/appointments')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: 12, padding: 0, marginBottom: 14 }}
          onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}>
          <IconBack /> Appointments
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.4px', marginBottom: 3 }}>New Appointment</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {isWalkIn ? 'Walk-in booking — confirm patient registration before proceeding.' : 'Book for an existing patient or register a new one to continue.'}
            </div>
          </div>
          {isWalkIn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(253,230,138,0.15)', border: '1px solid rgba(253,230,138,0.3)', borderRadius: 9, padding: '8px 14px', marginBottom: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FCD34D', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#FCD34D', fontWeight: 600 }}>Walk-in patient</span>
              <button onClick={() => navigate('/receptionist/patients/register')}
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', marginLeft: 4 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}>
                Register patient
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable form body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 32px' }}>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Patient card */}
          <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E8EFF8', padding: '20px 22px' }}>
            <SectionLabel>Patient</SectionLabel>

            <div style={{ display: 'flex', background: '#F8FAFC', borderRadius: 9, padding: 3, gap: 2, marginBottom: 16, border: '1px solid #E2E8F0' }}>
              {[{ key: 'existing', label: 'Existing Patient' }, { key: 'new', label: 'New Patient' }].map(m => (
                <button key={m.key}
                  onClick={() => { setPatientMode(m.key); setPatientId(null); setPatientLabel(''); setAutofill(null); }}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: patientMode === m.key ? '#FFF' : 'transparent', color: patientMode === m.key ? DARK : '#94A3B8', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: patientMode === m.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.12s' }}>
                  {m.label}
                </button>
              ))}
            </div>

            {patientMode === 'existing' ? (
              <>
                <FormGroup label="Select Patient" required error={errors.patient}>
                  <PatientSearch token={token} onSelect={handlePatientSelect} prePatient={prePatient} />
                </FormGroup>
                {loadingVisits && <div style={{ fontSize: 11, color: '#94A3B8', padding: '8px 12px', background: '#F8FAFC', borderRadius: 8 }}>Checking patient history…</div>}
                {!loadingVisits && autofill && (
                  <div style={{ padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                      <IconSparkle /> Follow-up on file from Dr. {autofill.doctorName}
                    </div>
                    {autofill.followUpNotes && <div style={{ fontSize: 11, color: '#78350F' }}>{autofill.followUpNotes}</div>}
                    {autofill.followUpDate  && <div style={{ fontSize: 11, color: '#78350F' }}>Suggested date: {autofill.followUpDate}</div>}
                    <button onClick={applyAutofill}
                      style={{ marginTop: 2, alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, color: '#92400E', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 7, padding: '5px 12px', cursor: 'pointer' }}>
                      Apply to form
                    </button>
                  </div>
                )}
              </>
            ) : patientId ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#475569', flexShrink: 0 }}>
                  {patientLabel.split(' ').map(w => w[0]).slice(0, 2).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{patientLabel}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>New patient registered</div>
                </div>
                <button onClick={() => { setPatientId(null); setPatientLabel(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
              </div>
            ) : (
              <>
                {errors.patient && <div style={{ fontSize: 11, color: '#E11D48', marginBottom: 8 }}>{errors.patient}</div>}
                <NewPatientForm token={token}
                  onCreated={(p) => { setPatientId(p.id); setPatientLabel(`${p.first_name} ${p.last_name}`); }}
                  onCancel={() => setPatientMode('existing')} />
              </>
            )}
          </div>

          {/* Doctor + schedule card */}
          <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E8EFF8', padding: '20px 22px' }}>
            <SectionLabel>Schedule</SectionLabel>

            <FormGroup label="Doctor" required error={errors.doctor}>
              <Select value={doctorId} onChange={e => { setDoctorId(e.target.value); setApiErr(''); setIsConflict(false); }}>
                <option value="">Select doctor…</option>
                {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}{d.designation ? ` — ${d.designation}` : ''}</option>)}
              </Select>
            </FormGroup>

            <FormGroup label="Visit Type" required error={errors.visitType}>
              <Select value={visitType} onChange={e => setVisitType(e.target.value)}>
                <option value="">Select type…</option>
                {VISIT_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
              </Select>
            </FormGroup>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormGroup label="Date" required error={errors.date}>
                <Input type="date" value={date} onChange={e => { setDate(e.target.value); setApiErr(''); setIsConflict(false); }} />
              </FormGroup>
              <FormGroup label="Time" required error={errors.time}>
                <Input type="time" value={time} onChange={e => { setTime(e.target.value); setApiErr(''); setIsConflict(false); }} />
              </FormGroup>
            </div>

            <FormGroup label="Duration">
              <Select value={duration} onChange={e => setDuration(Number(e.target.value))}>
                {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
              </Select>
            </FormGroup>

            {/* Conflict / error banner */}
            {apiErr && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, padding: '11px 14px', background: isConflict ? '#FFF7ED' : '#FFF1F2', borderRadius: 9, border: `1px solid ${isConflict ? '#FED7AA' : '#FECDD3'}`, color: isConflict ? '#C2410C' : '#E11D48' }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}><IconAlert /></span>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{isConflict ? 'Time slot unavailable' : 'Booking failed'}</div>
                  <div style={{ fontWeight: 400 }}>{apiErr}{isConflict && selectedDoctor ? ` — Dr. ${selectedDoctor.last_name} already has an appointment at this time.` : ''}</div>
                  {isConflict && <div style={{ marginTop: 5, fontSize: 11, color: '#92400E' }}>Please choose a different time or reduce the duration.</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E8EFF8', padding: '20px 22px' }}>
            <SectionLabel>Notes</SectionLabel>

            <FormGroup label="Reason for Visit" hint="Helps the doctor prepare">
              <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Follow-up on blood pressure medication" />
            </FormGroup>

            <FormGroup label="Internal Notes" hint="Visible to staff only">
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Optional internal notes…" rows={5}
                style={{ ...inputBase, border: '1.5px solid #E2E8F0', resize: 'vertical' }}
                onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px ${ACCENT}18`; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }} />
            </FormGroup>
          </div>

          {/* Summary */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E8EFF8', padding: '16px 20px' }}>
            <SectionLabel>Summary</SectionLabel>
            {[
              { label: 'Visit Type', value: visitType || '—' },
              { label: 'Duration',   value: `${duration} min` },
              { label: 'Date',       value: date ? new Date(date + 'T00:00:00').toLocaleDateString('en-JM', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
              { label: 'Time',       value: time ? (() => { const [h,m] = time.split(':'); const hr = parseInt(h); return `${hr%12||12}:${m} ${hr>=12?'PM':'AM'}`; })() : '—' },
              { label: 'Doctor',     value: selectedDoctor ? `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}` : '—' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12, padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#94A3B8', fontWeight: 500, flexShrink: 0, marginRight: 8 }}>{row.label}</span>
                <span style={{ color: '#0F172A', fontWeight: 600, textAlign: 'right' }}>{row.value}</span>
              </div>
            ))}
            {/* Booked by — current staff member */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '8px 0 2px' }}>
              <span style={{ color: '#94A3B8', fontWeight: 500, flexShrink: 0, marginRight: 8 }}>Booked by</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#0F172A', fontWeight: 600 }}>{user ? `${user.first_name} ${user.last_name}` : '—'}</span>
                <span style={{ fontSize: 10, fontWeight: 700, background: '#E0F2FE', color: '#0369A1', borderRadius: 5, padding: '1px 6px', fontFamily: 'monospace', letterSpacing: '0.3px' }}>{staffNumber}</span>
              </div>
            </div>
          </div>

          {successMsg && <div style={{ fontSize: 12, color: '#059669', padding: '10px 14px', background: '#F0FDF4', borderRadius: 9, border: '1px solid #BBF7D0' }}>{successMsg}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => navigate('/receptionist/appointments')}
              style={{ padding: '11px 22px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; }}>
              Cancel
            </button>
            <button onClick={submit} disabled={saving}
              style={{ padding: '11px 28px', borderRadius: 10, border: 'none', background: saving ? '#94A3B8' : DARK, color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', transition: 'background 0.14s' }}>
              {saving ? 'Booking…' : 'Book Appointment'}
            </button>
          </div>
        </div>
      </div>

      </div>{/* end scrollable body */}
    </div>
  );
}
