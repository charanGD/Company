import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { Shield, Lock, FileText, Users } from 'lucide-react';
import { auth, provider } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    }
  };

  const features = [
    { icon: Shield, title: 'DPDP Compliant', desc: 'Section 8(10) grievance redressal' },
    { icon: FileText, title: 'Track Tickets', desc: 'Real-time status updates' },
    { icon: Users, title: 'DPO Dashboard', desc: 'Full admin management' },
    { icon: Lock, title: 'Audit Logged', desc: 'Immutable action history' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Background gradient orbs */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)',
        top: -200, left: -200, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)',
        bottom: -150, right: -150, pointerEvents: 'none',
      }} />

      {/* Left Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{
            width: 48, height: 48,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
          }}>
            <Shield size={26} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              GrievanceShield
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              DPDP Act Compliance Portal
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 440 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
            Privacy Grievance{' '}
            <span style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Redressal
            </span>
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40 }}>
            Submit, track, and resolve privacy complaints in compliance with the Digital Personal Data Protection Act 2023.
          </p>

          {/* Feature Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 48 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 16,
              }}>
                <Icon size={18} color="#6366f1" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Sign In Button */}
          <button onClick={login} style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '16px 24px',
            background: 'white',
            border: 'none', borderRadius: 14,
            fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            color: '#1e293b',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            By signing in, you agree to our{' '}
            <a href="/privacy-policy" style={{ color: '#6366f1', textDecoration: 'none' }}>Privacy Policy</a>
            {' '}and consent to data processing as per DPDP Act 2023.
          </p>
        </div>
      </div>

      {/* Right Panel (decorative) */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg,rgba(99,102,241,0.1) 0%,rgba(139,92,246,0.05) 100%)',
        borderLeft: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 60,
        position: 'relative',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{
            width: 120, height: 120,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            borderRadius: '30px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 32px',
            boxShadow: '0 24px 64px rgba(99,102,241,0.4)',
            animation: 'pulse-glow 3s infinite',
          }}>
            <Shield size={56} color="white" />
          </div>
          <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Your Privacy, Protected
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            All grievances are handled by a certified Data Protection Officer within the statutory 30-day timeline mandated by the DPDP Act 2023.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 32 }}>
            {[['30', 'Day Resolution'], ['100%', 'Audited'], ['AES-256', 'Encrypted']].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#6366f1' }}>{val}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}