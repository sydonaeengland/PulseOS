import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import TopBar from '../../components/admin/TopBar';
import Toast from '../../components/admin/Toast';
import { getSettings, updateSettings } from '../../api/settings';

/*
  Abbreviation algorithm — runs automatically from clinic_name.
  Rules (in order):
  1. Strip common filler words: "and", "of", "the", "a", "&", "at", "for"
  2. Take the first letter of each remaining word, uppercase
  3. Cap at 4 characters
  4. If only one word remains, take the first 3 letters
  Examples:
    "Harbour View Family Practice" → HVFP
    "Kingston Medical Centre"      → KMC
    "City Clinic"                  → CC
    "St. Andrew Health"            → SAH
    "PulseOS"                      → PUL  (single word fallback)
*/
const STOPWORDS = new Set(['and','of','the','a','an','&','at','for','to','in','by']);

export function deriveAbbreviation(name) {
  if (!name?.trim()) return '';
  const words = name.trim().split(/\s+/).filter(w => !STOPWORDS.has(w.toLowerCase().replace(/\W/g, '')));
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map(w => w.replace(/\W/g, '')[0] ?? '').join('').toUpperCase().slice(0, 4);
}

const PARISHES = [
  'Kingston','St. Andrew','St. Thomas','Portland','St. Mary',
  'St. Ann','Trelawny','St. James','Hanover','Westmoreland',
  'St. Elizabeth','Manchester','Clarendon','St. Catherine',
];

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', fontSize: 13, color: '#0F172A',
  background: '#FFFFFF', border: '1.5px solid #E2E8F0',
  borderRadius: 8, outline: 'none',
};

function Field({ label, children, span }) {
  return (
    <div style={span ? { gridColumn: `span ${span}` } : {}}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function AdminSettings() {
  const { token } = useAuth();
  const [form, setForm]       = useState({
    clinic_name: '', address_line1: '', address_line2: '', parish: 'Kingston',
    phone: '', email: '', registration_number: '', receipt_prefix: '',
    clinic_abbreviation: '',
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState({ message: '', type: 'success' });

  useEffect(() => {
    getSettings(token)
      .then(res => {
        const d = res.data.data ?? {};
        setForm(prev => ({ ...prev, ...d }));
      })
      .catch(() => {}) // endpoint not built yet — form stays empty
      .finally(() => setLoading(false));
  }, [token]);

  function showToast(message, type = 'success') {
    setToast({ message: '', type });
    setTimeout(() => setToast({ message, type }), 10);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      // Auto-derive abbreviation when clinic_name changes,
      // but only if the user hasn't manually edited clinic_abbreviation.
      // We detect "manually edited" by checking if the current abbreviation
      // matches what the algorithm would produce from the old name.
      // If it does (or is empty), we update it automatically.
      if (name === 'clinic_name') {
        const autoFromOld = deriveAbbreviation(prev.clinic_name);
        const isAuto = !prev.clinic_abbreviation || prev.clinic_abbreviation === autoFromOld;
        if (isAuto) next.clinic_abbreviation = deriveAbbreviation(value);
      }
      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(form, token);
      showToast('Settings saved successfully.');
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <TopBar title="Settings" />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F9FC' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '3px solid #E2E8F0', borderTopColor: '#1B4F72',
            animation: 'spin 0.8s linear infinite',
          }} />
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Settings" />
      <Toast message={toast.message} type={toast.type} />

      <main style={{ flex: 1, overflowY: 'auto', background: '#F7F9FC', padding: '28px 32px 48px' }}>
        <form onSubmit={handleSave}>

          {/* Clinic info */}
          <div style={{ background: '#FFFFFF', border: '1px solid #F1F5F9', borderRadius: 12, padding: '24px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1B4F72', margin: '0 0 20px' }}>
              Clinic information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Clinic name" span={2}>
                <input name="clinic_name" value={form.clinic_name} onChange={handleChange}
                  placeholder="Harbour View Family Practice" style={inputStyle} />
              </Field>
              <Field label="Address line 1">
                <input name="address_line1" value={form.address_line1} onChange={handleChange}
                  placeholder="12 Harbour Street" style={inputStyle} />
              </Field>
              <Field label="Address line 2">
                <input name="address_line2" value={form.address_line2} onChange={handleChange}
                  placeholder="Suite 3" style={inputStyle} />
              </Field>
              <Field label="Parish">
                <select name="parish" value={form.parish} onChange={handleChange}
                  style={{ ...inputStyle, background: '#FAFAFA' }}>
                  {PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Phone">
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="876-555-0100" style={inputStyle} />
              </Field>
              <Field label="Email">
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="info@clinic.com" style={inputStyle} />
              </Field>
              <Field label="Registration number">
                <input name="registration_number" value={form.registration_number} onChange={handleChange}
                  placeholder="MOH-2024-00123" style={inputStyle} />
              </Field>
              <Field label="Receipt prefix">
                <input name="receipt_prefix" value={form.receipt_prefix} onChange={handleChange}
                  placeholder="HVFP" style={inputStyle} />
              </Field>
              <Field label="Clinic abbreviation">
                <div style={{ position: 'relative' }}>
                  <input
                    name="clinic_abbreviation"
                    value={form.clinic_abbreviation}
                    onChange={handleChange}
                    placeholder={deriveAbbreviation(form.clinic_name) || 'e.g. HVFP'}
                    maxLength={6}
                    style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  />
                  {/* Show "auto" tag when value matches the derived result */}
                  {form.clinic_abbreviation && form.clinic_abbreviation === deriveAbbreviation(form.clinic_name) && (
                    <span style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 9, fontWeight: 700, color: '#00B37E',
                      background: '#F0FDF9', border: '1px solid #A7F3D0',
                      borderRadius: 4, padding: '1px 5px', letterSpacing: '0.3px',
                      pointerEvents: 'none',
                    }}>
                      AUTO
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '5px 0 0', lineHeight: 1.4 }}>
                  Auto-generated from your clinic name. Edit to override — used in patient IDs, receipts, and the sidebar.
                </p>
              </Field>
            </div>
          </div>

          {/* Save */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit" disabled={saving}
              style={{
                fontSize: 13, fontWeight: 600, color: '#FFFFFF',
                background: '#1B4F72', border: 'none', borderRadius: 8,
                padding: '10px 28px', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.65 : 1, transition: 'opacity 0.15s ease',
              }}
            >
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>

        </form>
      </main>
    </>
  );
}
