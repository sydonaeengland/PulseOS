import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Toast store (module-level singleton) ──────────────────────────────────
let _setToasts = null;
let _idCounter = 0;

export function toast(message, { undo, duration = 5000 } = {}) {
  if (!_setToasts) return;
  const id = ++_idCounter;
  _setToasts(prev => [...prev, { id, message, undo, duration, exiting: false }]);
  return id;
}

export function dismissToast(id) {
  if (!_setToasts) return;
  _setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
  setTimeout(() => {
    _setToasts(prev => prev.filter(t => t.id !== id));
  }, 280);
}

// ─── Single toast item ─────────────────────────────────────────────────────

function ToastItem({ t, onDismiss }) {
  const timerRef = useRef(null);
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const total = t.duration;
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      setProgress(Math.max(0, 100 - (elapsed / total) * 100));
      if (elapsed < total) {
        timerRef.current = requestAnimationFrame(tick);
      } else {
        onDismiss(t.id);
      }
    };
    timerRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(timerRef.current);
  }, []);

  return (
    <div
      style={{
        background: '#1E293B',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.12)',
        padding: '0',
        minWidth: 280,
        maxWidth: 380,
        overflow: 'hidden',
        transform: t.exiting ? 'translateY(12px)' : 'translateY(0)',
        opacity: t.exiting ? 0 : 1,
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px' }}>
        {/* Status dot */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#0EA5E9', flexShrink: 0,
        }} />

        {/* Message */}
        <div style={{ fontSize: 13, fontWeight: 500, color: '#F1F5F9', flex: 1, lineHeight: 1.4 }}>
          {t.message}
        </div>

        {/* Undo button */}
        {t.undo && (
          <button
            onClick={() => { t.undo(); onDismiss(t.id); }}
            style={{
              fontSize: 12, fontWeight: 700, color: '#0EA5E9',
              background: 'rgba(14,165,233,0.12)',
              border: '1px solid rgba(14,165,233,0.25)',
              borderRadius: 7, padding: '4px 10px',
              cursor: 'pointer', flexShrink: 0,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(14,165,233,0.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(14,165,233,0.12)'; }}
          >
            Undo
          </button>
        )}

        {/* Dismiss */}
        <button
          onClick={() => onDismiss(t.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748B', padding: '2px 4px', borderRadius: 5,
            display: 'flex', alignItems: 'center', flexShrink: 0,
            transition: 'color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#94A3B8'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; }}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{
          height: '100%', background: '#0EA5E9',
          width: `${progress}%`, transition: 'width 0.05s linear',
        }} />
      </div>
    </div>
  );
}

// ─── Toast container — mount once at app root ──────────────────────────────

export default function UndoToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _setToasts = setToasts;
    return () => { _setToasts = null; };
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 280);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem t={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
