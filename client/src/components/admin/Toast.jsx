import { useState, useEffect } from 'react';

/*
  How to build a toast without a library:
  - `show` controls visibility (opacity + translateY for smooth entry/exit)
  - useEffect watches the `message` prop — whenever it changes to a non-empty
    string, we make it visible, then set a 3-second timeout to hide it
  - The cleanup function cancels the timeout if the component unmounts early
    or if a new message arrives before the old one expires
*/

export default function Toast({ message, type = 'success' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const bg    = type === 'success' ? '#00B37E' : '#EF4444';
  const icon  = type === 'success' ? '✓' : '✕';

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      background: bg, color: '#FFFFFF',
      padding: '12px 20px', borderRadius: 10,
      fontSize: 13, fontWeight: 500,
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-12px)',
      transition: 'opacity 0.25s ease, transform 0.25s ease',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      <span style={{ fontWeight: 700 }}>{icon}</span>
      {message}
    </div>
  );
}
