import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, FileText, Users, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DEMO_ACCOUNTS = [
  { username: 'admin',  password: 'admin123',  role: 'Admin',  color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  { username: 'staff',  password: 'staff123',  role: 'Staff',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { username: 'user',   password: 'user123',   role: 'User',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
];

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const u = await login(username.trim(), password);
      // Redirect based on role
      navigate(u.role === 'admin' || u.role === 'staff' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    }
    setSubmitting(false);
  };

  const fillDemo = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
  };

  const features = [
    { icon: Shield,   title: 'DPDP Compliant',  desc: 'Section 8(10) grievance redressal' },
    { icon: FileText, title: 'Track Tickets',   desc: 'Real-time status updates' },
    { icon: Users,    title: 'DPO Dashboard',   desc: 'Full admin management' },
    { icon: Lock,     title: 'Audit Logged',    desc: 'Immutable action history' },
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

      {/* ── Left Panel ────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px',
        position: 'relative', zIndex: 1,
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
          <h2 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.15, marginBottom: 10 }}>
            Welcome{' '}
            <span style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Back
            </span>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32 }}>
            Sign in to manage privacy grievances under the Digital Personal Data Protection Act 2023.
          </p>

          {/* Feature Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 40 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 12, padding: 14,
              }}>
                <Icon size={17} color="#6366f1" style={{ marginBottom: 7 }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* ── Login Form ── */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: 28,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
              Sign In to Your Account
            </h3>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                color: '#ef4444', fontSize: 13,
              }}>
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Username */}
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  id="login-username"
                  className="form-input"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  disabled={submitting}
                />
              </div>

              {/* Password */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Password</label>
                <input
                  id="login-password"
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  disabled={submitting}
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: 36,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 2,
                  }}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14, marginTop: 4 }}
              >
                {submitting
                  ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Signing in...</>
                  : <><LogIn size={16} /> Sign In</>
                }
              </button>
            </form>
          </div>

          {/* Demo Accounts */}
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 12 }}>
              — Demo Accounts —
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.username}
                  onClick={() => fillDemo(acc)}
                  style={{
                    flex: 1,
                    padding: '9px 8px',
                    background: acc.bg,
                    border: `1px solid ${acc.color}33`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <p style={{ fontSize: 12, fontWeight: 700, color: acc.color }}>{acc.role}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{acc.username}</p>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              Click a demo account to auto-fill credentials
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel (decorative) ──────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg,rgba(99,102,241,0.1) 0%,rgba(139,92,246,0.05) 100%)',
        borderLeft: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 60, position: 'relative',
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
            {[['30', 'Day Resolution'], ['100%', 'Audited'], ['3', 'Role Levels']].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#6366f1' }}>{val}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lbl}</p>
              </div>
            ))}
          </div>

          {/* Role Info Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 36 }}>
            {[
              { role: 'Admin',  desc: 'Full control — manage tickets, assign, close', color: '#6366f1' },
              { role: 'Staff',  desc: 'View all tickets, add DPO remarks', color: '#10b981' },
              { role: 'User',   desc: 'Submit & track your own grievances', color: '#3b82f6' },
            ].map(r => (
              <div key={r.role} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.role}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}