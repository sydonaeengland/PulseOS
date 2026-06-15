import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listPatients, searchPatients } from '../../api/patients';

function IconSearch() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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
  ['#F1F5F9', '#0A2540'],
  ['#F0FDF4', '#059669'],
  ['#FFF7ED', '#D97706'],
  ['#FAF5FF', '#7C3AED'],
  ['#FFF1F2', '#E11D48'],
];

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function PatientRow({ patient, onClick }) {
  const [hov, setHov] = useState(false);
  const name = `${patient.first_name} ${patient.last_name}`;
  const [bg, fg] = avatarColor(name);
  const initials = (patient.first_name?.charAt(0) ?? '') + (patient.last_name?.charAt(0) ?? '');

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 160px 120px 120px 40px',
        alignItems: 'center',
        gap: 12,
        padding: '13px 20px',
        cursor: 'pointer',
        background: hov ? '#FAFBFC' : 'transparent',
        transition: 'background 0.1s',
        borderBottom: '1px solid #F8FAFC',
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
        {initials.toUpperCase()}
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{name}</div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, fontFamily: 'monospace', letterSpacing: '0.2px' }}>{patient.patient_number ?? '—'}</div>
      </div>

      <div style={{ fontSize: 12, color: '#475569' }}>{patient.phone ?? '—'}</div>

      <div style={{ fontSize: 12, color: '#475569' }}>
        {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('en-JM', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
      </div>

      <div>
        <span style={{
          fontSize: 11, fontWeight: 600,
          background: patient.status === 'active' ? '#F0FDF4' : '#FFF7ED',
          color: patient.status === 'active' ? '#059669' : '#D97706',
          border: `1px solid ${patient.status === 'active' ? '#BBF7D0' : '#FED7AA'}`,
          borderRadius: 20, padding: '2px 9px',
        }}>
          {patient.status === 'active' ? 'Active' : 'Pending'}
        </span>
      </div>

      <div style={{ color: hov ? '#0A2540' : '#E2E8F0', display: 'flex', justifyContent: 'center', transition: 'color 0.14s' }}>
        <IconChevronRight />
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function ReceptionistPatients() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [q, setQ]               = useState('');
  const [allPatients, setAll]   = useState([]);
  const [results, setResults]   = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [page, setPage]         = useState(1);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    listPatients(token)
      .then(r => setAll(r.data?.data?.patients ?? []))
      .catch(() => setAll([]))
      .finally(() => setLoadingAll(false));
  }, [token]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); setPage(1); return; }
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoadingSearch(true);
      searchPatients(q, token)
        .then(r => setResults(r.data?.data?.patients ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoadingSearch(false));
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [q, token]);

  const displayed   = q.trim() ? results : allPatients;
  const isSearching = q.trim().length > 0;
  const loading     = isSearching ? loadingSearch : loadingAll;

  const totalPages  = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const pageSlice   = displayed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ background: '#0A2540', padding: '20px 32px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.4px', marginBottom: 3 }}>Patients</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {loadingAll ? 'Loading…' : `${allPatients.length} patient${allPatients.length !== 1 ? 's' : ''} registered`}
            </div>
          </div>
          <button
            onClick={() => navigate('/receptionist/patients/register')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, background: '#0EA5E9', border: 'none', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0284C7'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0EA5E9'; }}
          >
            <IconPlus /> Register Patient
          </button>
        </div>

        <div style={{ position: 'relative', maxWidth: 480, paddingBottom: 20 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-60%)', color: 'rgba(255,255,255,0.4)', display: 'flex', pointerEvents: 'none' }}>
            <IconSearch />
          </span>
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name, ID, or phone…"
            style={{
              width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)', fontSize: 13, color: '#FFFFFF',
              background: 'rgba(255,255,255,0.08)', outline: 'none', boxSizing: 'border-box',
            }}
          />
          {loading && (
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-60%)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              Loading…
            </span>
          )}
        </div>
      </div>

      {/* ── Scrollable table ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#F5F7FA', padding: '20px 32px' }}>
        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #EEF2F7', overflow: 'hidden' }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 160px 120px 120px 40px', gap: 12, padding: '10px 20px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC' }}>
            {['', 'Patient', 'Phone', 'Date of Birth', 'Status', ''].map((col, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{col}</div>
            ))}
          </div>

          {loading && displayed.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading…</div>
          ) : displayed.length === 0 && isSearching ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>No patients found</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 14 }}>No results for "{q}"</div>
              <button
                onClick={() => navigate('/receptionist/patients/register')}
                style={{ padding: '8px 18px', borderRadius: 8, background: '#0A2540', border: 'none', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Register new patient
              </button>
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ padding: '52px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>No patients registered yet</div>
            </div>
          ) : (
            pageSlice.map(p => (
              <PatientRow key={p.id} patient={p} onClick={() => navigate(`/receptionist/patients/${p.id}`)} />
            ))
          )}
        </div>

        {!loading && displayed.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>
              {isSearching
                ? `${displayed.length} result${displayed.length !== 1 ? 's' : ''}`
                : `${allPatients.length} patient${allPatients.length !== 1 ? 's' : ''} total`
              }
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#FFFFFF', color: safePage === 1 ? '#CBD5E1' : '#475569', fontSize: 11, fontWeight: 600, cursor: safePage === 1 ? 'default' : 'pointer' }}>
                  Prev
                </button>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) => p === '…' ? (
                      <span key={`dots${i}`} style={{ padding: '5px 4px', fontSize: 11, color: '#94A3B8' }}>…</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p)}
                        style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #E2E8F0', background: p === safePage ? '#0A2540' : '#FFFFFF', color: p === safePage ? '#FFFFFF' : '#475569', fontSize: 11, fontWeight: p === safePage ? 700 : 500, cursor: 'pointer' }}>
                        {p}
                      </button>
                    ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#FFFFFF', color: safePage === totalPages ? '#CBD5E1' : '#475569', fontSize: 11, fontWeight: 600, cursor: safePage === totalPages ? 'default' : 'pointer' }}>
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
