import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerPatient } from '../../api/patients';

const ACCENT = '#0EA5E9';
const DARK   = '#0A2540';

function IconChevronLeft() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function IconUserPlus() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}

function FormGroup({ label, required, children, hint, error }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#E11D48', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && !error && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{hint}</div>}
      {error && <div style={{ fontSize: 11, color: '#E11D48', marginTop: 3 }}>{error}</div>}
    </div>
  );
}

const inputStyle = (focused) => ({
  width: '100%', padding: '9px 12px', borderRadius: 9,
  border: `1.5px solid ${focused ? ACCENT : '#E2E8F0'}`,
  boxShadow: focused ? `0 0 0 3px ${ACCENT}18` : 'none',
  fontSize: 13, color: '#0F172A', outline: 'none',
  background: '#FFFFFF', boxSizing: 'border-box',
  transition: 'border-color 0.14s, box-shadow 0.14s',
  fontFamily: 'inherit',
});

function Input({ value, onChange, type = 'text', placeholder, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={inputStyle(focused)} {...rest}
    />
  );
}

function Select({ value, onChange, children }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value} onChange={onChange}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...inputStyle(focused), cursor: 'pointer' }}
    >
      {children}
    </select>
  );
}

const PARISHES = ['Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary', 'St. Ann', 'Trelawny', 'St. James', 'Hanover', 'Westmoreland', 'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const INSURANCE_PROVIDERS = ['Sagicor', 'Guardian Life', 'Canopy', 'JN Life', 'JMMB', 'Self Pay', 'NHF Only', 'Other'];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 16 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function ReceptionistRegisterPatient() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '', last_name: '', date_of_birth: '',
    sex: '', phone: '', email: '', address: '',
    parish: '', id_number: '',
    blood_type: '', insurance_provider: '', nhf_member: '',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
  });

  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [apiErr, setApiErr]   = useState('');
  const [success, setSuccess] = useState('');

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.last_name.trim())  e.last_name  = 'Required';
    if (!form.date_of_birth)     e.date_of_birth = 'Required';
    if (!form.sex)               e.sex = 'Required';
    if (!form.phone.trim())      e.phone  = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true); setApiErr(''); setSuccess('');
    try {
      const payload = {
        ...form,
        nhf_member: form.nhf_member === 'yes' ? true : form.nhf_member === 'no' ? false : undefined,
        consent_given: true,
      };
      await registerPatient(payload, token);
      setSuccess('Patient registered successfully. They will appear as "Pending" until activated.');
      setTimeout(() => navigate('/receptionist/patients'), 1800);
    } catch (e) {
      setApiErr(e.response?.data?.message ?? 'Failed to register patient');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 780, boxSizing: 'border-box' }}>

      {/* Back */}
      <button
        onClick={() => navigate('/receptionist/patients')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13, padding: 0, marginBottom: 20 }}
        onMouseEnter={e => { e.currentTarget.style.color = ACCENT; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; }}
      >
        <IconChevronLeft /> Back to Patients
      </button>

      {/* Page header card */}
      <div style={{
        background: DARK, borderRadius: 16, padding: '24px 28px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 18, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', border: `24px solid ${ACCENT}15`, pointerEvents: 'none' }} />
        <div style={{
          width: 50, height: 50, borderRadius: 14, background: `${ACCENT}22`,
          border: `1px solid ${ACCENT}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: ACCENT, flexShrink: 0, position: 'relative', zIndex: 1,
        }}>
          <IconUserPlus />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px' }}>Register New Patient</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>Patient will be "Pending" status until reviewed and activated</div>
        </div>
      </div>

      {/* Form card */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8EFF8', padding: '28px 32px', boxShadow: '0 2px 12px rgba(14,165,233,0.06)' }}>

        {/* Personal */}
        <Section title="Personal Information">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormGroup label="First Name" required error={errors.first_name}>
              <Input value={form.first_name} onChange={set('first_name')} placeholder="Marcus" />
            </FormGroup>
            <FormGroup label="Last Name" required error={errors.last_name}>
              <Input value={form.last_name} onChange={set('last_name')} placeholder="Brown" />
            </FormGroup>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <FormGroup label="Date of Birth" required error={errors.date_of_birth}>
              <Input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
            </FormGroup>
            <FormGroup label="Sex" required error={errors.sex}>
              <Select value={form.sex} onChange={set('sex')}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </FormGroup>
            <FormGroup label="National ID / TRN">
              <Input value={form.id_number} onChange={set('id_number')} placeholder="000-000-000" />
            </FormGroup>
          </div>
        </Section>

        <div style={{ height: 1, background: '#F1F5F9', marginBottom: 24 }} />

        {/* Contact */}
        <Section title="Contact Information">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormGroup label="Phone Number" required error={errors.phone}>
              <Input value={form.phone} onChange={set('phone')} placeholder="876-000-0000" />
            </FormGroup>
            <FormGroup label="Email Address">
              <Input type="email" value={form.email} onChange={set('email')} placeholder="patient@email.com" />
            </FormGroup>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormGroup label="Address">
              <Input value={form.address} onChange={set('address')} placeholder="14 Main Street" />
            </FormGroup>
            <FormGroup label="Parish">
              <Select value={form.parish} onChange={set('parish')}>
                <option value="">Select parish…</option>
                {PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </FormGroup>
          </div>
        </Section>

        <div style={{ height: 1, background: '#F1F5F9', marginBottom: 24 }} />

        {/* Medical */}
        <Section title="Medical Information">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <FormGroup label="Blood Type">
              <Select value={form.blood_type} onChange={set('blood_type')}>
                <option value="">Unknown</option>
                {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Insurance Provider">
              <Select value={form.insurance_provider} onChange={set('insurance_provider')}>
                <option value="">None / Unknown</option>
                {INSURANCE_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="NHF Member">
              <Select value={form.nhf_member} onChange={set('nhf_member')}>
                <option value="">Unknown</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </Select>
            </FormGroup>
          </div>
        </Section>

        <div style={{ height: 1, background: '#F1F5F9', marginBottom: 24 }} />

        {/* Emergency Contact */}
        <Section title="Emergency Contact">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <FormGroup label="Full Name">
              <Input value={form.emergency_contact_name} onChange={set('emergency_contact_name')} placeholder="e.g. Mary Brown" />
            </FormGroup>
            <FormGroup label="Phone Number">
              <Input value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} placeholder="876-xxx-xxxx" />
            </FormGroup>
            <FormGroup label="Relationship">
              <Input value={form.emergency_contact_relation} onChange={set('emergency_contact_relation')} placeholder="e.g. Spouse, Parent, Sibling" />
            </FormGroup>
          </div>
        </Section>

        {/* Feedback */}
        {apiErr  && <div style={{ fontSize: 12, color: '#E11D48', marginBottom: 14, padding: '10px 14px', background: '#FFF1F2', borderRadius: 9, border: '1px solid #FECDD3' }}>{apiErr}</div>}
        {success && <div style={{ fontSize: 12, color: '#059669', marginBottom: 14, padding: '10px 14px', background: '#F0FDF4', borderRadius: 9, border: '1px solid #BBF7D0' }}>{success}</div>}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <button
            onClick={() => navigate('/receptionist/patients')}
            style={{ padding: '10px 22px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; }}
          >
            Cancel
          </button>
          <button
            onClick={submit} disabled={saving}
            style={{
              padding: '10px 28px', borderRadius: 10, border: 'none',
              background: saving ? '#7DD3FC' : ACCENT,
              color: '#FFFFFF', fontSize: 13, fontWeight: 700,
              cursor: saving ? 'default' : 'pointer',
              transition: 'background 0.14s',
              boxShadow: saving ? 'none' : `0 4px 12px ${ACCENT}40`,
            }}
          >
            {saving ? 'Registering…' : 'Register Patient'}
          </button>
        </div>
      </div>
    </div>
  );
}
