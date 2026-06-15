import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import TopBar from '../../components/admin/TopBar';
import Toast from '../../components/admin/Toast';
import { getPendingPatients, activatePatient } from '../../api/patients';

const PARISHES = [
  'Kingston','St. Andrew','St. Thomas','Portland','St. Mary',
  'St. Ann','Trelawny','St. James','Hanover','Westmoreland',
  'St. Elizabeth','Manchester','Clarendon','St. Catherine',
];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function RoleBadge({ source }) {
  const label = source === 'self' ? 'Self-registered' : 'Staff entry';
  const color = source === 'self' ? '#6366F1' : '#64748B';
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color,
      background: source === 'self' ? '#EEF2FF' : '#F1F5F9',
      padding: '2px 8px', borderRadius: 20,
    }}>
      {label}
    </span>
  );
}

/*
  Key React pattern taught here:
  - useEffect(fn, [token]) fetches on mount (and if token ever changes)
  - After activating, we filter the patient OUT of local state instead of
    re-fetching the whole list — faster, no extra network request, and the
    row disappears instantly which gives better feedback
*/

export default function AdminPatients() {
  const { token } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState({ message: '', type: 'success' });
  const [activating, setActivating] = useState(null);

  useEffect(() => {
    setLoading(true);
    getPendingPatients(token)
      .then(res => setPatients(res.data.data ?? []))
      .catch(() => showToast('Failed to load pending patients.', 'error'))
      .finally(() => setLoading(false));
  }, [token]);

  function showToast(message, type = 'success') {
    setToast({ message: '', type }); // reset first so same message re-triggers
    setTimeout(() => setToast({ message, type }), 10);
  }

  async function handleActivate(patient) {
    setActivating(patient.id);
    try {
      await activatePatient(patient.id, token);
      // Remove from list locally — no refetch needed
      setPatients(prev => prev.filter(p => p.id !== patient.id));
      showToast(`${patient.first_name} ${patient.last_name} activated successfully.`);
    } catch {
      showToast('Failed to activate patient. Please try again.', 'error');
    } finally {
      setActivating(null);
    }
  }

  return (
    <>
      <TopBar title="Pending Patients" />
      <Toast message={toast.message} type={toast.type} />

      <main style={{ flex: 1, overflowY: 'auto', background: '#F7F9FC', padding: '28px 32px 48px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #F1F5F9', borderRadius: 12, overflow: 'hidden' }}>

          {/* Card header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1B4F72', margin: 0, marginBottom: 3 }}>
              Pending registrations
            </h2>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
              Self-registered patients awaiting admin approval before they can be seen
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '3px solid #E2E8F0', borderTopColor: '#1B4F72',
                animation: 'spin 0.8s linear infinite', margin: '0 auto',
              }} />
            </div>
          )}

          {/* Empty state */}
          {!loading && patients.length === 0 && (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1B4F72', marginBottom: 4 }}>
                No pending registrations
              </div>
              <div style={{ fontSize: 13, color: '#94A3B8' }}>
                All patient registrations have been reviewed.
              </div>
            </div>
          )}

          {/* Table */}
          {!loading && patients.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Patient', 'Date of birth', 'Phone', 'Parish', 'Source', 'Submitted', ''].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px', textAlign: 'left',
                        fontSize: 11, fontWeight: 600, color: '#94A3B8',
                        letterSpacing: '0.4px', textTransform: 'uppercase',
                        borderBottom: '1px solid #F1F5F9',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                          {p.first_name} {p.last_name}
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
                          {p.id_number ?? `P-${String(p.id).padStart(5, '0')}`}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748B' }}>
                        {formatDate(p.date_of_birth)}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748B' }}>
                        {p.phone ?? '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748B' }}>
                        {p.parish ?? '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <RoleBadge source={p.registration_source} />
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#94A3B8' }}>
                        {formatDate(p.created_at)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => handleActivate(p)}
                          disabled={activating === p.id}
                          style={{
                            fontSize: 12, fontWeight: 600,
                            color: '#FFFFFF', background: '#00B37E',
                            border: 'none', borderRadius: 8,
                            padding: '7px 14px', cursor: activating === p.id ? 'not-allowed' : 'pointer',
                            opacity: activating === p.id ? 0.6 : 1,
                            transition: 'opacity 0.15s ease',
                          }}
                        >
                          {activating === p.id ? 'Activating…' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
