import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from '../../components/UndoToast';

const ACCENT = '#0EA5E9';
const DARK   = '#0A2540';
const BASE   = import.meta.env.VITE_API_BASE_URL;

function IcoPrint() {
  return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm1-4h.01" /></svg>;
}
function IcoCheck() {
  return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
}
function IcoRefresh() {
  return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}

const TYPE_STYLES = {
  prescription: { bg: '#EFF8FF', border: '#BAE6FD', color: '#0369A1', dot: '#0EA5E9',   label: 'Prescription' },
  otc_note:     { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D', dot: '#22C55E',   label: 'OTC Note' },
  referral:     { bg: '#EDE9FE', border: '#DDD6FE', color: '#5B21B6', dot: '#8B5CF6',   label: 'Referral' },
  sick_note:    { bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C', dot: '#F59E0B',   label: 'Sick Note' },
  other:        { bg: '#F8FAFC', border: '#E2E8F0', color: '#475569', dot: '#94A3B8',   label: 'Document' },
};

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-JM', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-JM', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Simulated print queue since real backend endpoint may not exist yet
const MOCK_QUEUE = [
  { id: 1, type: 'prescription', patient_name: 'Marcus Williams', doctor_name: 'Dr. Patel', created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(), content: 'Metformin 500mg — twice daily with meals\nLisinopril 10mg — once daily\nAtorvastatin 20mg — at bedtime', printed: false },
  { id: 2, type: 'otc_note',     patient_name: 'Sarah Chen',     doctor_name: 'Dr. Brown', created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(), content: 'Paracetamol 500mg — every 6 hours as needed for pain\nStrepsils lozenges — every 3-4 hours for sore throat\nRest and increase fluid intake', printed: false },
  { id: 3, type: 'sick_note',    patient_name: 'James Thompson', doctor_name: 'Dr. Patel', created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), content: 'Mr. James Thompson was seen at Kingston Medical on today\'s date and is unfit for work for 3 days due to acute febrile illness. He may return to work on Monday, 16 June 2026.', printed: false },
  { id: 4, type: 'referral',     patient_name: 'Denise Brown',   doctor_name: 'Dr. Singh', created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), content: 'Referral to Cardiologist\n\nDear Dr. Clarke,\nI am referring Mrs. Brown for specialist review of her ongoing palpitations. Echo and Holter requested.\n\nThank you,\nDr. Singh', printed: true },
];

function PrintItemCard({ item, onPrint, onMarkDone, printed }) {
  const [expanded, setExpanded] = useState(false);
  const [printing, setPrinting] = useState(false);
  const s = TYPE_STYLES[item.type] ?? TYPE_STYLES.other;

  const handlePrint = async () => {
    setPrinting(true);
    // Open browser print dialog with the document content
    const win = window.open('', '_blank', 'width=700,height=600');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>${s.label} — ${item.patient_name}</title>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0F172A; line-height: 1.6; }
              .header { border-bottom: 2px solid #0A2540; padding-bottom: 16px; margin-bottom: 24px; }
              .clinic { font-size: 20px; font-weight: 800; color: #0A2540; }
              .doc-type { font-size: 13px; color: #0EA5E9; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
              .patient { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
              .meta { font-size: 12px; color: #64748B; margin-bottom: 20px; }
              .content { font-size: 14px; white-space: pre-wrap; line-height: 1.8; }
              .footer { margin-top: 40px; border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="clinic">Kingston Medical Centre</div>
              <div class="doc-type">${s.label}</div>
            </div>
            <div class="patient">Patient: ${item.patient_name}</div>
            <div class="meta">Issued by: ${item.doctor_name} &nbsp;·&nbsp; Date: ${new Date().toLocaleDateString('en-JM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div class="content">${item.content}</div>
            <div class="footer">This document was generated by PulseOS — Kingston Medical Centre</div>
          </body>
        </html>
      `);
      win.document.close();
      win.print();
      win.close();
    }
    setTimeout(() => {
      setPrinting(false);
      onMarkDone(item.id);
      toast(`Printed: ${s.label} for ${item.patient_name}`);
    }, 500);
  };

  return (
    <div style={{
      borderRadius: 14, border: `1px solid ${printed ? '#E2E8F0' : s.border}`,
      background: printed ? '#FAFBFC' : '#FFF',
      opacity: printed ? 0.72 : 1,
      overflow: 'hidden',
      transition: 'all 0.15s',
    }}>
      {/* Top strip */}
      <div style={{ height: 3, background: printed ? '#E2E8F0' : s.dot }} />

      <div style={{ padding: '14px 18px' }}>
        {/* Row 1: type pill + patient + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: '2px 9px', whiteSpace: 'nowrap', flexShrink: 0 }}>{s.label}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{item.patient_name}</span>
            <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 8 }}>via {item.doctor_name}</span>
          </div>
          <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0 }}>{fmtTime(item.created_at)}</span>
        </div>

        {/* Preview / expand */}
        <div
          onClick={() => setExpanded(e => !e)}
          style={{ fontSize: 12, color: '#64748B', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded ? 'pre-wrap' : 'nowrap', lineHeight: 1.6, marginBottom: 10, padding: '8px 10px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #F1F5F9', transition: 'all 0.12s' }}>
          {item.content}
        </div>
        <div style={{ fontSize: 10, color: '#CBD5E1', textAlign: 'center', marginBottom: 10, cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Collapse' : 'Expand'}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {printed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#10B981' }}>
              <IcoCheck /> Printed
            </div>
          ) : (
            <button
              onClick={handlePrint}
              disabled={printing}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 9, border: 'none', background: DARK, color: '#FFF', fontSize: 12, fontWeight: 700, cursor: printing ? 'default' : 'pointer', opacity: printing ? 0.7 : 1, transition: 'opacity 0.12s' }}>
              <IcoPrint /> {printing ? 'Printing…' : 'Print'}
            </button>
          )}
          {!printed && (
            <button onClick={() => onMarkDone(item.id)}
              style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', background: 'none', border: '1px solid #E2E8F0', borderRadius: 9, padding: '7px 14px', cursor: 'pointer', transition: 'all 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#10B981'; e.currentTarget.style.borderColor = '#BBF7D0'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>
              Mark done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReceptionistPrintQueue() {
  const { token } = useAuth();
  const [queue, setQueue] = useState(MOCK_QUEUE);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showPrinted, setShowPrinted] = useState(false);

  const markDone = (id) => setQueue(prev => prev.map(item => item.id === id ? { ...item, printed: true } : item));
  const clearDone = () => setQueue(prev => prev.filter(item => !item.printed));

  const active   = queue.filter(i => !i.printed);
  const done     = queue.filter(i => i.printed);
  const filtered = (showPrinted ? queue : active).filter(i => filterType === 'all' || i.type === filterType);

  return (
    <div style={{ padding: '20px 24px', boxSizing: 'border-box', height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ background: DARK, borderRadius: 16, padding: '20px 28px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', border: '24px solid rgba(14,165,233,0.1)', pointerEvents: 'none' }} />
        <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, flexShrink: 0, zIndex: 1 }}>
          <IcoPrint />
        </div>
        <div style={{ zIndex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>Print Queue</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>Prescriptions and documents sent by doctors for printing</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
          {active.length > 0 && (
            <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF', background: ACCENT, borderRadius: 20, padding: '2px 12px', minWidth: 28, textAlign: 'center' }}>{active.length}</span>
          )}
          <button onClick={() => setLoading(l => !l)} title="Refresh"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9, padding: '8px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
            <IcoRefresh />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, flexShrink: 0 }}>
        {/* Type filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', ...Object.keys(TYPE_STYLES)].map(key => {
            const count = key === 'all' ? (showPrinted ? queue : active).length : (showPrinted ? queue : active).filter(i => i.type === key).length;
            const s = key === 'all' ? { label: 'All', color: DARK, bg: '#EFF8FF', border: '#BAE6FD' } : TYPE_STYLES[key];
            const active2 = filterType === key;
            return (
              <button key={key} onClick={() => setFilterType(key)}
                style={{ fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '4px 12px', cursor: 'pointer', border: `1px solid ${active2 ? s.border : '#EEF2F7'}`, background: active2 ? s.bg : '#F8FAFC', color: active2 ? s.color : '#94A3B8', transition: 'all 0.1s' }}>
                {s.label} {count > 0 && count}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setShowPrinted(s => !s)}
            style={{ fontSize: 11, fontWeight: 600, color: showPrinted ? ACCENT : '#94A3B8', background: showPrinted ? '#EFF8FF' : '#F8FAFC', border: `1px solid ${showPrinted ? '#BAE6FD' : '#E2E8F0'}`, borderRadius: 9, padding: '6px 12px', cursor: 'pointer' }}>
            {showPrinted ? 'Hide printed' : `Show printed (${done.length})`}
          </button>
          {done.length > 0 && (
            <button onClick={clearDone}
              style={{ fontSize: 11, fontWeight: 600, color: '#E11D48', background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 9, padding: '6px 12px', cursor: 'pointer' }}>
              Clear {done.length} printed
            </button>
          )}
        </div>
      </div>

      {/* Queue */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 240, background: '#FFF', borderRadius: 16, border: '1px solid #E8EFF8' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EFF8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, marginBottom: 14 }}><IcoPrint /></div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>No documents to print</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>When doctors send prescriptions or notes, they'll appear here</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(item => (
              <PrintItemCard key={item.id} item={item} onMarkDone={markDone} printed={item.printed} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
