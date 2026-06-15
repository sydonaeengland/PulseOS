export default function ActivityRow({ actor, action, target, time, last }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0' }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: '#EFF6FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#1B4F72',
        }}>
          {actor.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{actor}</span>
          {' '}
          <span style={{ fontSize: 13, color: '#64748B' }}>{action}</span>
          {' '}
          <span style={{ fontSize: 12, color: '#00B37E', fontFamily: 'monospace' }}>{target}</span>
        </div>
        <span style={{ fontSize: 11, color: '#CBD5E1', flexShrink: 0 }}>{time}</span>
      </div>
      {!last && <div style={{ height: 1, background: '#F8FAFC' }} />}
    </>
  );
}
