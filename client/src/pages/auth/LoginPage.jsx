import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=1200&q=80',
    title: 'Built for Jamaican clinics',
    subtitle: 'Scheduling, records, and billing — all in one place.',
  },
  {
    image: 'https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=1200&q=80',
    title: 'AI-assisted clinical notes',
    subtitle: 'Doctors write naturally. PulseOS structures the rest.',
  },
  {
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&q=80',
    title: 'DPA 2020 compliant',
    subtitle: 'Patient data protected under Jamaican law from day one.',
  },
  {
    image: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?w=1200&q=80',
    title: 'From booking to checkout',
    subtitle: 'Every step of the patient journey, digitised.',
  },
];

const ROLE_REDIRECTS = {
  receptionist: '/receptionist',
  doctor: '/doctor',
  nurse: '/nurse',
  admin: '/admin',
};

function Slideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

      {SLIDES.map((slide, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${slide.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            opacity: i === current ? 1 : 0,
            transition: 'opacity 1.4s ease-in-out',
          }}
        />
      ))}

      {/* Light blue full overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(186,218,255,0.22)',
      }} />

      {/* Bottom gradient for text legibility */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(6,18,38,0.82) 0%, rgba(6,18,38,0.12) 52%, transparent 100%)',
      }} />

      {/* PulseOS wordmark top-left of slideshow */}
      <div style={{ position: 'absolute', top: 32, left: 36, zIndex: 20, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.35))' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.4px' }}>Pulse</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#00B37E', letterSpacing: '-0.4px' }}>OS</span>
      </div>

      {/* Slide content — bottom */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '0 40px 44px',
      }}>
        <p style={{
          fontSize: 26, fontWeight: 700, color: '#FFFFFF',
          lineHeight: 1.25, margin: 0, marginBottom: 10,
          letterSpacing: '-0.3px',
        }}>
          {SLIDES[current].title}
        </p>
        <p style={{
          fontSize: 14, color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.6, margin: 0, marginBottom: 28,
        }}>
          {SLIDES[current].subtitle}
        </p>

        {/* Pill dots */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                height: 4,
                width: i === current ? 32 : 10,
                borderRadius: 9999,
                border: 'none', padding: 0,
                cursor: 'pointer',
                background: i === current ? '#C9A84C' : 'rgba(255,255,255,0.38)',
                transition: 'width 0.35s ease, background 0.35s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [loading, setLoading]           = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await login(email, password);
      // Brief pause so the pulse animation completes before the screen changes
      await new Promise((resolve) => setTimeout(resolve, 300));
      navigate(ROLE_REDIRECTS[user.role] ?? '/login', { replace: true });
    } catch (err) {
      setErrorMsg(err.response?.data?.error ?? 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const onFocus = (e) => { e.target.style.borderColor = '#1B4F72'; };
  const onBlur  = (e) => { e.target.style.borderColor = '#D1D5DB'; };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Left: slideshow ── */}
      <div className="hidden lg:block" style={{ width: '48%', flexShrink: 0, height: '100%' }}>
        <Slideshow />
      </div>

      {/* ── Right: form panel ── */}
      <div style={{
        flex: 1, height: '100%',
        display: 'flex', flexDirection: 'column',
        background: '#FFFFFF',
        borderLeft: '1px solid #F1F5F9',
        overflowY: 'auto',
      }}>

        {/* Centred form block — py keeps breathing room on tall screens, min-h ensures centering */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '32px 56px',
          minHeight: 0,
        }}>
          <div style={{ width: '100%', maxWidth: 360 }}>

            {/* Wordmark centred */}
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: '#1B4F72', letterSpacing: '-0.6px' }}>Pulse</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: '#00B37E', letterSpacing: '-0.6px' }}>OS</span>
              </div>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                Medical office management for Jamaican clinics
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#F1F5F9', marginBottom: 22 }} />

            {/* Heading */}
            <div style={{ marginBottom: 20 }}>
              <h1 style={{
                fontSize: 24, fontWeight: 700,
                color: '#1B4F72',
                margin: 0, marginBottom: 4,
                letterSpacing: '-0.4px', lineHeight: 1.2,
              }}>
                Welcome back
              </h1>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
                Sign in to your account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Email */}
              <div>
                <label htmlFor="email" style={{
                  display: 'block', fontSize: 12, fontWeight: 500,
                  color: '#374151', marginBottom: 5,
                }}>
                  Your Email
                </label>
                <input
                  id="email" type="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email"
                  placeholder="you@clinic.com"
                  onFocus={onFocus} onBlur={onBlur}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '11px 14px', fontSize: 14, color: '#0F172A',
                    background: '#FFFFFF', border: '1.5px solid #D1D5DB',
                    borderRadius: 10, outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" style={{
                  display: 'block', fontSize: 12, fontWeight: 500,
                  color: '#374151', marginBottom: 5,
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required autoComplete="current-password"
                    placeholder="••••••••"
                    onFocus={onFocus} onBlur={onBlur}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '11px 44px 11px 14px', fontSize: 14, color: '#0F172A',
                      background: '#FFFFFF', border: '1.5px solid #D1D5DB',
                      borderRadius: 10, outline: 'none',
                      transition: 'border-color 0.15s ease',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      color: '#9CA3AF', display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {errorMsg && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  fontSize: 13, color: '#DC2626',
                  background: '#FEF2F2', border: '1px solid #FECACA',
                  borderRadius: 10, padding: '10px 14px',
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#163F5C'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1B4F72'; }}
                style={{
                  width: '100%', height: 46,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#1B4F72', color: '#FFFFFF',
                  fontSize: 14, fontWeight: 600, letterSpacing: '0.1px',
                  border: 'none', borderRadius: 10,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.65 : 1,
                  transition: 'background 0.15s ease',
                  marginTop: 4,
                }}
              >
                {loading ? (
                  <div style={{
                    width: 20, height: 20,
                    borderRadius: '50%',
                    border: '2.5px solid #ffffff',
                    animation: 'pulse-ring 1s ease-out infinite',
                  }} />
                ) : 'Access portal'}
              </button>

              {/* Security note */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#CBD5E1" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span style={{ fontSize: 11, color: '#CBD5E1' }}>End-to-end secure · DPA 2020 compliant</span>
              </div>

            </form>

            {/* Footer — sits right below form, no gap */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <span style={{ fontSize: 11, color: '#D1D5DB' }}>PulseOS · Made for Jamaican clinics</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
