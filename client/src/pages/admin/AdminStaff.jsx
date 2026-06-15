import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import TopBar from '../../components/admin/TopBar';
import Toast from '../../components/admin/Toast';
import { getStaff, createStaff, deactivateStaff } from '../../api/staff';

const ROLES = ['doctor', 'nurse', 'receptionist', 'admin'];

const ROLE_STYLES = {
  doctor:       { color: '#1B4F72', background: '#EFF6FF' },
  nurse:        { color: '#00B37E', background: '#ECFDF5' },
  receptionist: { color: '#64748B', background: '#F1F5F9' },
  admin:        { color: '#D97706', background: '#FFFBEB' },
};

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', role: 'receptionist',
  phone: '', mcj_number: '', password: '',
};

function RoleBadge({ role }) {
  const s = ROLE_STYLES[role] ?? ROLE_STYLES.receptionist;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color: s.color, background: s.background,
      padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize',
    }}>
      {role}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', fontSize: 13, color: '#0F172A',
  background: '#FFFFFF', border: '1.5px solid #E2E8F0',
  borderRadius: 8, outline: 'none',
};

/*
  Why inline form instead of a modal:
  Modals require managing open/close state, focus trapping, backdrop clicks,
  and accessibility. An inline form is just a conditional render — show it
  when showForm is true, hide it when false. Much simpler in React, and works
  better on narrow screens too.
*/

export default function AdminStaff() {
  const { token } = useAuth();
  const [staff, setStaff]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]       = useState({ message: '', type: 'success' });

  useEffect(() => {
    getStaff(token)
      .then(res => setStaff(res.data.data ?? []))
      .catch(() => showToast('Could not load staff. Endpoint may not exist yet.', 'error'))
      .finally(() => setLoading(false));
  }, [token]);

  function showToast(message, type = 'success') {
    setToast({ message: '', type });
    setTimeout(() => setToast({ message, type }), 10);
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createStaff(form, token);
      setStaff(prev => [res.data.data, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      showToast(`${form.first_name} ${form.last_name} added successfully.`);
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Failed to create staff account.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(member) {
    try {
      await deactivateStaff(member.id, token);
      setStaff(prev => prev.map(s => s.id === member.id ? { ...s, is_active: 0 } : s));
      showToast(`${member.first_name} ${member.last_name} deactivated.`);
    } catch {
      showToast('Failed to deactivate staff member.', 'error');
    }
  }

  return (
    <>
      <TopBar title="Staff" />
      <Toast message={toast.message} type={toast.type} />

      <main style={{ flex: 1, overflowY: 'auto', background: '#F7F9FC', padding: '28px 32px 48px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1B4F72', margin: 0, marginBottom: 2 }}>
              Staff accounts
            </h2>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
              Manage who has access to PulseOS
            </p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            style={{
              fontSize: 13, fontWeight: 600, color: '#FFFFFF',
              background: showForm ? '#64748B' : '#1B4F72',
              border: 'none', borderRadius: 8, padding: '9px 18px',
              cursor: 'pointer', transition: 'background 0.15s ease',
            }}
          >
            {showForm ? 'Cancel' : '+ Add staff'}
          </button>
        </div>

        {/* Inline create form */}
        {showForm && (
          <div style={{
            background: '#FFFFFF', border: '1px solid #F1F5F9',
            borderRadius: 12, padding: '24px', marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1B4F72', margin: '0 0 20px' }}>
              New staff account
            </h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="First name">
                  <input name="first_name" value={form.first_name} onChange={handleChange}
                    required placeholder="Aisha" style={inputStyle} />
                </Field>
                <Field label="Last name">
                  <input name="last_name" value={form.last_name} onChange={handleChange}
                    required placeholder="Campbell" style={inputStyle} />
                </Field>
                <Field label="Email">
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    required placeholder="aisha@clinic.com" style={inputStyle} />
                </Field>
                <Field label="Phone">
                  <input name="phone" value={form.phone} onChange={handleChange}
                    placeholder="876-555-0100" style={inputStyle} />
                </Field>
                <Field label="Role">
                  <select name="role" value={form.role} onChange={handleChange}
                    style={{ ...inputStyle, background: '#FAFAFA' }}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </Field>
                {form.role === 'doctor' && (
                  <Field label="MCJ number">
                    <input name="mcj_number" value={form.mcj_number} onChange={handleChange}
                      placeholder="MCJ-00000" style={inputStyle} />
                  </Field>
                )}
                <Field label="Password">
                  <input name="password" type="password" value={form.password} onChange={handleChange}
                    required placeholder="Minimum 8 characters" style={inputStyle} />
                </Field>
              </div>
              <button
                type="submit" disabled={submitting}
                style={{
                  fontSize: 13, fontWeight: 600, color: '#FFFFFF',
                  background: '#1B4F72', border: 'none', borderRadius: 8,
                  padding: '10px 24px', cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.65 : 1,
                }}
              >
                {submitting ? 'Creating…' : 'Create account'}
              </button>
            </form>
          </div>
        )}

        {/* Staff list */}
        <div style={{ background: '#FFFFFF', border: '1px solid #F1F5F9', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '3px solid #E2E8F0', borderTopColor: '#1B4F72',
                animation: 'spin 0.8s linear infinite', margin: '0 auto',
              }} />
            </div>
          ) : staff.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
              No staff accounts yet. Add one above.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Name', 'Role', 'Email', 'Phone', 'Status', ''].map(h => (
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
                {staff.map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                        {m.first_name} {m.last_name}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}><RoleBadge role={m.role} /></td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748B' }}>{m.email}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748B' }}>{m.phone ?? '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: m.is_active ? '#00B37E' : '#94A3B8',
                        background: m.is_active ? '#ECFDF5' : '#F1F5F9',
                        padding: '3px 10px', borderRadius: 20,
                      }}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {m.is_active ? (
                        <button
                          onClick={() => handleDeactivate(m)}
                          style={{
                            fontSize: 12, fontWeight: 500, color: '#EF4444',
                            background: '#FEF2F2', border: '1px solid #FECACA',
                            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                          }}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#CBD5E1' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}
