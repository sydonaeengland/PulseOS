import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPendingPatients, activatePatient } from '../../api/patients';

function IconClipboard() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

const AVATAR_COLORS = [
  ['#EFF8FF', '#0A2540'],
  ['#F0F9FF', '#059669'],
  ['#FFF7ED', '#D97706'],
  ['#FDF4FF', '#7C3AED'],
];

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-JM', { year: 'numeric', month: 'short', day: 'numeric' });
}

function PatientCard({ patient, onActivate, activating }) {
  const [hov, setHov] = useState(false);
  const name = `${patient.first_name} ${patient.last_name}`;
  const [bg, fg] = avatarColor(name);
  const initials = (patient.first_name?.charAt(0) ?? '') + (patient.last_name?.charAt(0) ?? '');

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${hov ? '#D97706' + '40' : '#EEF2F7'}`,
        borderRadius: 14, padding: '18px 20px',
        transition: 'border-color 0.16s, box-shadow 0.16s',
        boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Amber pending strip */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#D97706', borderRadius: '14px 14px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
          {initials.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>{name}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 10 }}>
            Registered {fmtDate(patient.created_at)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px' }}>
            {[
              { label: 'Phone', value: patient.phone },
              { label: 'DOB', value: fmtDate(patient.date_of_birth) },
              { label: 'ID Number', value: patient.id_number },
              { label: 'Insurance', value: patient.insurance_provider },
            ].map(({ label, value }) => value ? (
              <div key={label}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label} </span>
                <span style={{ fontSize: 12, color: '#475569' }}>{value}</span>
              </div>
            ) : null)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button
          onClick={() => onActivate(patient.id)}
          disabled={activating}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            flex: 1, padding: '9px 14px', borderRadius: 9,
            background: activating ? '#F0F9FF' : '#059669',
            border: 'none', color: '#FFFFFF', fontSize: 12, fontWeight: 600,
            cursor: activating ? 'default' : 'pointer', opacity: activating ? 0.7 : 1,
            transition: 'opacity 0.14s', justifyContent: 'center',
          }}
        >
          <IconCheck />
          {activating ? 'Activating…' : 'Activate Patient'}
        </button>
      </div>
    </div>
  );
}

export default function ReceptionistPendingRegistrations() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activating, setActivating] = useState(null);
  const [successIds, setSuccessIds] = useState([]);

  const load = () => {
    setLoading(true);
    getPendingPatients(token)
      .then(r => setPatients(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (token) load(); }, [token]);

  const handleActivate = async (id) => {
    setActivating(id);
    try {
      await activatePatient(id, token);
      setSuccessIds(prev => [...prev, id]);
      setTimeout(() => {
        setPatients(prev => prev.filter(p => p.id !== id));
        setSuccessIds(prev => prev.filter(x => x !== id));
      }, 800);
    } catch {
      // silently retry or show inline error
    } finally {
      setActivating(null);
    }
  };

  const pending = patients.filter(p => !successIds.includes(p.id));

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>
            Review patient self-registrations and activate their accounts
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={load}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Refresh
          </button>
          <button
            onClick={() => navigate('/receptionist/patients/register')}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0A2540', color: '#FFFFFF', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            + Register Manually
          </button>
        </div>
      </div>

      {/* Count banner */}
      {!loading && pending.length > 0 && (
        <div style={{
          background: '#FFFBEB', border: '1px solid #FDE68A',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D97706', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>
            {pending.length} patient{pending.length !== 1 ? 's' : ''} awaiting review
          </span>
          <span style={{ fontSize: 12, color: '#B45309' }}>
            — Review each registration and activate when identity is confirmed
          </span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8', fontSize: 13 }}>
          Loading pending registrations…
        </div>
      ) : pending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: '#059669',
          }}>
            <IconClipboard />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#059669', marginBottom: 6 }}>All clear</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>No pending registrations to review.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {pending.map(p => (
            <PatientCard
              key={p.id}
              patient={p}
              onActivate={handleActivate}
              activating={activating === p.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
