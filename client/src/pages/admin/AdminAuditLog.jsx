import { useState } from 'react';
import TopBar from '../../components/admin/TopBar';

const COLUMNS = [
  { key: 'timestamp',     label: 'Timestamp',    width: 160 },
  { key: 'user',          label: 'User',          width: 160 },
  { key: 'action',        label: 'Action',        width: 130 },
  { key: 'resource_type', label: 'Resource type', width: 140 },
  { key: 'resource_id',   label: 'Resource ID',   width: 120 },
  { key: 'ip',            label: 'IP address',    width: 130 },
];

const ACTION_TYPES = ['All actions', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW'];

function IconShield() {
  return (
    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#1E3A5F" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function IconFilter() {
  return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AuditStat({ label, value, sub, color = '#1E3A5F' }) {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #EEF2F7', borderRadius: 12,
      padding: '14px 18px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    }}>
      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginBottom: 6, letterSpacing: '0.3px' }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-1px', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: '#CBD5E1' }}>{sub}</div>}
    </div>
  );
}

export default function AdminAuditLog() {
  const [actionFilter, setActionFilter] = useState('All actions');
  const [hovExport, setHovExport] = useState(false);

  return (
    <>
      <TopBar title="Audit Log" breadcrumb="System" />

      <main style={{ flex: 1, overflowY: 'auto', background: '#F0F4F8', padding: '18px 22px 48px' }}>

        {/* Summary stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <AuditStat label="Total events"   value="—" sub="Endpoint not yet live" color="#1E3A5F" />
          <AuditStat label="Events today"   value="—" sub="24-hour window"        color="#00B37E" />
          <AuditStat label="Unique users"   value="—" sub="Active in period"      color="#C9A84C" />
          <AuditStat label="Failed actions" value="—" sub="Auth & permission"     color="#DC2626" />
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#FFFFFF', border: '1px solid #EEF2F7',
              borderRadius: 8, padding: '7px 12px', color: '#94A3B8',
            }}>
              <span style={{ display: 'flex' }}><IconFilter /></span>
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                disabled
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 12, color: '#94A3B8', cursor: 'not-allowed',
                  appearance: 'none',
                }}
              >
                {ACTION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#FFFFFF', border: '1px solid #EEF2F7',
              borderRadius: 8, padding: '7px 12px', color: '#94A3B8', fontSize: 12,
            }}>
              <span style={{ display: 'flex' }}><IconClock /></span>
              Last 7 days
            </div>
            <span style={{ fontSize: 11, color: '#CBD5E1' }}>Filters active once endpoint is live</span>
          </div>

          <button
            disabled
            onMouseEnter={() => setHovExport(true)}
            onMouseLeave={() => setHovExport(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600,
              color: hovExport ? '#1E3A5F' : '#64748B',
              background: hovExport ? '#EFF6FF' : '#FFFFFF',
              border: '1px solid #EEF2F7', borderRadius: 8,
              padding: '7px 14px', cursor: 'not-allowed', transition: 'all 0.14s',
            }}
          >
            <IconDownload />
            Export CSV
          </button>
        </div>

        {/* Table panel */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #EEF2F7', borderRadius: 14,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {COLUMNS.map(col => (
                    <th key={col.key} style={{
                      width: col.width, padding: '10px 16px', textAlign: 'left',
                      fontSize: 10, fontWeight: 700, color: '#94A3B8',
                      letterSpacing: '0.5px', textTransform: 'uppercase',
                      borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap',
                    }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={COLUMNS.length}>
                    <div style={{
                      padding: '52px 24px 44px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
                    }}>
                      <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: '#EFF6FF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 16,
                      }}>
                        <IconShield />
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                        Audit log coming soon
                      </div>
                      <div style={{
                        fontSize: 12, color: '#94A3B8', textAlign: 'center',
                        maxWidth: 360, lineHeight: 1.65, marginBottom: 20,
                      }}>
                        Every user action — logins, record changes, deletions — will be recorded here for compliance and review.
                      </div>

                      {/* Event type tags */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
                        {[
                          { label: 'Login / logout', color: '#1E3A5F' },
                          { label: 'Patient edits',  color: '#00B37E' },
                          { label: 'Staff changes',  color: '#C9A84C' },
                          { label: 'Deletions',      color: '#DC2626' },
                          { label: 'Settings',       color: '#7C3AED' },
                        ].map(({ label, color }) => (
                          <span key={label} style={{
                            fontSize: 11, fontWeight: 600, color,
                            background: `${color}12`, border: `1px solid ${color}30`,
                            borderRadius: 20, padding: '4px 12px',
                          }}>
                            {label}
                          </span>
                        ))}
                      </div>

                      {/* Endpoint reference */}
                      <div style={{
                        fontSize: 11, color: '#94A3B8',
                        background: '#F8FAFC', border: '1px solid #F1F5F9',
                        borderRadius: 8, padding: '8px 14px',
                      }}>
                        Wired to{' '}
                        <code style={{ fontFamily: 'monospace', fontSize: 11, color: '#1E3A5F', fontWeight: 600 }}>
                          GET /api/v1/audit-log
                        </code>
                        {' '}when available
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination shell */}
          <div style={{
            padding: '12px 20px', borderTop: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#FAFBFC',
          }}>
            <span style={{ fontSize: 12, color: '#CBD5E1' }}>Showing 0 of 0 events</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Previous', 'Next'].map(label => (
                <button key={label} disabled style={{
                  fontSize: 11, fontWeight: 500, color: '#CBD5E1',
                  background: '#F8FAFC', border: '1px solid #F1F5F9',
                  borderRadius: 7, padding: '6px 12px', cursor: 'not-allowed',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
