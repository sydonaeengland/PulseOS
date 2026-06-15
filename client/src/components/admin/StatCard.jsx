import { useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';

let PULSE_INJECTED = false;
function injectPulse() {
  if (PULSE_INJECTED) return;
  PULSE_INJECTED = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes pr { 0% { transform:scale(1); opacity:.6 } 70% { transform:scale(2.2); opacity:0 } 100% { opacity:0 } }
    @keyframes pd { 0%,100% { transform:scale(1) } 50% { transform:scale(1.15) } }
  `;
  document.head.appendChild(s);
}

function PulsingDot({ color = '#F59E0B' }) {
  useEffect(injectPulse, []);
  return (
    <div style={{ position:'relative', width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ position:'absolute', width:11, height:11, borderRadius:'50%', background:color, opacity:.5, animation:'pr 1.6s ease-out infinite' }} />
      <span style={{ width:7, height:7, borderRadius:'50%', background:color, display:'block', animation:'pd 1.6s ease-in-out infinite', position:'relative' }} />
    </div>
  );
}

function Sparkline({ data, type, color }) {
  const pts = data.map(v => ({ v }));
  if (type === 'bar') return (
    <ResponsiveContainer width={52} height={28}>
      <BarChart data={pts} margin={{ top:0, right:0, bottom:0, left:0 }} barSize={4}>
        <Bar dataKey="v" fill={color} radius={[2,2,0,0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
  return (
    <ResponsiveContainer width={52} height={28}>
      <LineChart data={pts} margin={{ top:2, right:0, bottom:2, left:0 }}>
        <Line dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/*
  STAT CARD DESIGN — from the reference images:

  Helanthus uses tinted card backgrounds (soft blue, soft pink, soft green,
  soft peach) — each card has its own colour identity so the grid doesn't
  read as a monotone wall. We implement this via the `tint` prop.

  MedCore adds a trend delta badge (↑ 10%) next to the subtitle — a compact
  coloured pill that communicates direction at a glance. We do the same via
  the `delta` + `deltaUp` props.

  The icon bubble (coloured circle top-left with the metric icon) is from
  Medioverse. We implement it via the `Icon` prop — the caller passes an
  SVG component.
*/

// CheckCircle icon for the all-clear state
function IconCheckCircle() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function StatCard({
  label, value, subtitle, accentColor,
  sparkline, sparklineType = 'line', sparklineColor,
  pulseDot = false, pulseDotColor = '#F59E0B',
  tint,
  Icon,
  iconBg,
  iconColor,
  delta,
  deltaUp = true,
  allClear = false,   // renders a premium "nothing to action" state
}) {
  const valueColor = accentColor ?? '#0F172A';
  const bg = tint ?? '#FFFFFF';
  const spColor = sparklineColor ?? accentColor ?? '#1B4F72';
  const iColor = iconColor ?? accentColor ?? '#1B4F72';
  const iBg = iconBg ?? `${iColor}18`;

  // ── All-clear variant ─────────────────────────────────────────────
  if (allClear) {
    return (
      <div style={{
        background: '#F0FDF9',
        borderRadius: 14,
        border: '1px solid #BBF7D0',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(5,150,105,0.06)',
        padding: '16px 18px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        {/* Decorative arc — subtle green circle in corner */}
        <div style={{
          position: 'absolute', bottom: -28, right: -28,
          width: 90, height: 90, borderRadius: '50%',
          border: '18px solid rgba(5,150,105,0.07)',
          pointerEvents: 'none',
        }} />

        <div>
          {/* Icon bubble + label */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(5,150,105,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ color: '#059669' }}>{Icon ? <Icon /> : <IconCheckCircle />}</span>
            </div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6EE7B7', letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: 6 }}>
            {label}
          </div>
          {/* Large checkmark + "All clear" as the value */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', letterSpacing: '-1px', lineHeight: 1 }}>
              All clear
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#34D399', fontWeight: 500 }}>
            No patients pending review
          </div>
        </div>

        {/* Bottom strip — confirmation bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 3,
          background: '#10B981',
          borderRadius: '0 0 14px 14px',
        }} />
      </div>
    );
  }

  // ── Standard variant ──────────────────────────────────────────────
  return (
    <div style={{
      background: bg,
      borderRadius: 14,
      border: '1px solid rgba(15,23,42,0.06)',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)',
      padding: '16px 18px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Top row: icon bubble + sparkline/dot */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        {Icon ? (
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: iBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: iColor }}><Icon /></span>
          </div>
        ) : (
          <span style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.8px', textTransform:'uppercase', paddingTop:3 }}>
            {label}
          </span>
        )}

        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
          {pulseDot && <PulsingDot color={pulseDotColor} />}
          {!pulseDot && sparkline && <Sparkline data={sparkline} type={sparklineType} color={spColor} />}
        </div>
      </div>

      {/* Label (only when icon is shown) */}
      {Icon && (
        <div style={{ fontSize:10, fontWeight:600, color:'#94A3B8', letterSpacing:'0.7px', textTransform:'uppercase', marginBottom:6 }}>
          {label}
        </div>
      )}

      {/* Value */}
      <div style={{ fontSize:30, fontWeight:800, color:valueColor, letterSpacing:'-1.5px', lineHeight:1, marginBottom:7 }}>
        {value}
      </div>

      {/* Subtitle + delta */}
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:11, color:'#94A3B8', fontWeight:500 }}>{subtitle}</span>
        {delta && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: deltaUp ? '#059669' : '#DC2626',
            background: deltaUp ? '#ECFDF5' : '#FEF2F2',
            borderRadius: 20, padding: '1px 6px',
          }}>
            {deltaUp ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>
    </div>
  );
}
