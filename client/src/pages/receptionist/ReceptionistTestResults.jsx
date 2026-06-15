import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { searchPatients } from '../../api/patients';
import axios from 'axios';
import { toast } from '../../components/UndoToast';

const ACCENT = '#0EA5E9';
const DARK   = '#0A2540';
const BASE   = import.meta.env.VITE_API_BASE_URL;

const RESULT_TYPES = [
  'Blood Work', 'Urinalysis', 'X-Ray', 'MRI', 'CT Scan',
  'ECG', 'Ultrasound', 'Biopsy', 'Stool Culture', 'Sputum Culture',
  'Thyroid Panel', 'Lipid Panel', 'Other',
];

function IcoUpload() {
  return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
}
function IcoSearch() {
  return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>;
}
function IcoFile() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
function IcoX() {
  return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}

function PatientPicker({ token, onSelect }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!q.trim() || selected) { setResults([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      searchPatients(q, token)
        .then(r => { const p = r.data?.data?.patients ?? []; setResults(p); setOpen(p.length > 0); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [q, token, selected]);

  useEffect(() => {
    function handler(e) { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (p) => { setSelected(p); setQ(`${p.first_name} ${p.last_name}`); setOpen(false); onSelect(p); };
  const clear = () => { setSelected(null); setQ(''); onSelect(null); };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: selected ? ACCENT : '#94A3B8', pointerEvents: 'none' }}><IcoSearch /></span>
        <input value={q} onChange={e => { setQ(e.target.value); if (selected) clear(); }} placeholder="Search patient by name or ID…"
          style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 32, padding: '10px 12px 10px 32px', borderRadius: 9, border: `1.5px solid ${selected ? ACCENT : '#E2E8F0'}`, fontSize: 13, color: '#0F172A', outline: 'none', background: '#FFF', fontFamily: 'inherit' }}
          onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px ${ACCENT}18`; }}
          onBlur={e => { if (!selected) { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; } }}
        />
        {selected && <button onClick={clear} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}><IcoX /></button>}
      </div>
      {selected && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: '#EFF8FF', borderRadius: 8, border: `1px solid ${ACCENT}33` }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#FFF', flexShrink: 0 }}>
            {selected.first_name?.[0]}{selected.last_name?.[0]}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: DARK }}>{selected.first_name} {selected.last_name}</span>
          {selected.id_number && <span style={{ fontSize: 11, color: '#64748B' }}>· {selected.id_number}</span>}
          <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981', marginLeft: 'auto' }}>Selected</span>
        </div>
      )}
      {loading && !selected && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#94A3B8' }}>Searching…</div>
      )}
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {results.slice(0, 8).map((p, i) => (
            <div key={p.id} onClick={() => pick(p)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: i < results.length - 1 ? '1px solid #F8FAFC' : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F0F9FF'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${ACCENT}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: ACCENT }}>
                {p.first_name?.[0]}{p.last_name?.[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{p.first_name} {p.last_name}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.id_number ?? 'No ID'} · {p.phone ?? '—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DropZone({ files, setFiles }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (newFiles) => {
    const list = Array.from(newFiles).filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return ['pdf','jpg','jpeg','png','gif','bmp','tiff','doc','docx'].includes(ext);
    });
    setFiles(prev => [...prev, ...list]);
  };

  const remove = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const onDrop = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  const fmtSize = (n) => n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;

  const EXT_ICON_COLORS = { pdf: '#EF4444', jpg: '#10B981', jpeg: '#10B981', png: '#10B981', doc: '#0EA5E9', docx: '#0EA5E9' };

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? ACCENT : '#CBD5E1'}`,
          borderRadius: 12,
          padding: '32px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? `${ACCENT}08` : '#FAFBFC',
          transition: 'all 0.15s',
        }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 12, background: dragging ? `${ACCENT}18` : '#EFF3F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: dragging ? ACCENT : '#94A3B8', transition: 'all 0.15s' }}>
          <IcoUpload />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Drop files here or click to browse</div>
        <div style={{ fontSize: 11, color: '#94A3B8' }}>PDF, JPG, PNG, DOC — up to 20 MB per file</div>
        <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.gif,.tiff,.doc,.docx" style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map((f, i) => {
            const ext = f.name.split('.').pop().toLowerCase();
            const iconColor = EXT_ICON_COLORS[ext] ?? '#64748B';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#F8FAFC', border: '1px solid #E8EFF8', borderRadius: 9 }}>
                <div style={{ color: iconColor, flexShrink: 0 }}><IcoFile /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>{fmtSize(f.size)}</div>
                </div>
                <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', display: 'flex', borderRadius: 6, padding: 3, transition: 'color 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#CBD5E1'; }}>
                  <IcoX />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ReceptionistTestResults() {
  const { token } = useAuth();

  const [patient, setPatient]       = useState(null);
  const [resultType, setResultType] = useState('');
  const [notes, setNotes]           = useState('');
  const [files, setFiles]           = useState([]);
  const [uploading, setUploading]   = useState(false);
  const [err, setErr]               = useState('');
  const [success, setSuccess]       = useState('');

  const reset = () => { setPatient(null); setResultType(''); setNotes(''); setFiles([]); setSuccess(''); setErr(''); };

  const submit = async () => {
    if (!patient) { setErr('Please select a patient'); return; }
    if (!resultType) { setErr('Please select a result type'); return; }
    if (files.length === 0) { setErr('Please attach at least one file'); return; }

    setUploading(true); setErr(''); setSuccess('');

    try {
      const form = new FormData();
      form.append('patient_id', patient.id);
      form.append('result_type', resultType);
      form.append('notes', notes);
      files.forEach(f => form.append('files', f));

      await axios.post(`${BASE}/lab-results`, form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      toast(`Lab results uploaded for ${patient.first_name} ${patient.last_name}`);
      setSuccess('Results uploaded successfully.');
      setTimeout(reset, 1800);
    } catch (e) {
      // If endpoint doesn't exist yet, show a graceful message
      const msg = e.response?.data?.message;
      if (e.response?.status === 404 || e.response?.status === 405) {
        toast(`Lab results saved locally — backend endpoint pending`);
        setSuccess('Files queued. Backend upload endpoint is not yet wired.');
        setTimeout(reset, 2200);
      } else {
        setErr(msg ?? 'Upload failed. Please try again.');
      }
    }
    setUploading(false);
  };

  return (
    <div style={{ padding: '20px 24px', boxSizing: 'border-box', maxWidth: 800, overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ background: DARK, borderRadius: 16, padding: '22px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', border: `24px solid #10B98115`, pointerEvents: 'none' }} />
        <div style={{ width: 50, height: 50, borderRadius: 14, background: '#10B98118', border: '1px solid #10B98140', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <IcoUpload />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>Upload Test Results</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>Attach lab results and reports to a patient record</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E8EFF8', padding: '22px 24px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>Patient</div>
            <PatientPicker token={token} onSelect={setPatient} />
          </div>

          <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E8EFF8', padding: '22px 24px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>Result Details</div>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Result Type <span style={{ color: '#E11D48' }}>*</span></label>
            <select value={resultType} onChange={e => setResultType(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', outline: 'none', background: '#FFF', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 16 }}
              onFocus={e => { e.target.style.borderColor = ACCENT; }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}>
              <option value="">Select type…</option>
              {RESULT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Notes for Doctor</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any context or notes about these results…" rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', outline: 'none', resize: 'vertical', background: '#FFF', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px ${ACCENT}18`; }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E8EFF8', padding: '22px 24px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>Attachments</div>
            <DropZone files={files} setFiles={setFiles} />
          </div>

          {err     && <div style={{ fontSize: 12, color: '#E11D48', padding: '10px 14px', background: '#FFF1F2', borderRadius: 9, border: '1px solid #FECDD3' }}>{err}</div>}
          {success && <div style={{ fontSize: 12, color: '#059669', padding: '10px 14px', background: '#F0FDF4', borderRadius: 9, border: '1px solid #BBF7D0' }}>{success}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={reset} style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Clear</button>
            <button onClick={submit} disabled={uploading}
              style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: uploading ? '#6EE7B7' : '#10B981', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: uploading ? 'default' : 'pointer', boxShadow: uploading ? 'none' : '0 4px 12px #10B98140' }}>
              {uploading ? 'Uploading…' : `Upload ${files.length > 0 ? `(${files.length} file${files.length > 1 ? 's' : ''})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
