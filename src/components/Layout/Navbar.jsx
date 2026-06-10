import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  Shield, Bell, Sun, Moon, LogOut, ChevronDown,
  LayoutDashboard, ShieldAlert, Settings, Cpu,
} from 'lucide-react';
import { auth } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function Navbar() {
  const { user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 'var(--navbar-height)',
      background: 'rgba(15,23,42,0.9)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: '16px',
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        textDecoration: 'none', marginRight: 'auto',
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Shield size={20} color="white" />
        </div>
        <span style={{
          fontSize: '18px', fontWeight: 800,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          GrievanceShield
        </span>
      </Link>

      {/* Nav Links */}
      {user && (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>
            <LayoutDashboard size={15} /> Dashboard
          </NavLink>
          <NavLink to="/privacy-policy" active={location.pathname === '/privacy-policy'}>
            <ShieldAlert size={15} /> Privacy Policy
          </NavLink>
          {role === 'admin' && (
            <>
              <NavLink to="/admin" active={location.pathname.startsWith('/admin')}>
                <Settings size={15} /> Admin
              </NavLink>
              <NavLink to="/ai/scanner" active={location.pathname.startsWith('/ai')}>
                <Cpu size={15} /> AI Tools
              </NavLink>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Theme toggle */}
        <button onClick={toggleTheme} style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '8px',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center',
          transition: 'all 0.2s',
        }}>
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Profile */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '6px 12px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                transition: 'all 0.2s',
              }}
            >
              {user.photoURL
                ? <img src={user.photoURL} alt="avatar" style={{ width: 26, height: 26, borderRadius: '50%' }} />
                : <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700 }}>
                    {user.displayName?.[0] || 'U'}
                  </div>
              }
              <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName?.split(' ')[0] || 'User'}
              </span>
              {role === 'admin' && (
                <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(99,102,241,0.2)', color: '#6366f1', padding: '2px 6px', borderRadius: 6 }}>
                  ADMIN
                </span>
              )}
              <ChevronDown size={14} />
            </button>

            {profileOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '110%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                minWidth: 200,
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                padding: '8px',
                zIndex: 200,
                animation: 'fadeIn 0.15s ease',
              }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.displayName}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', background: 'transparent', border: 'none',
                    cursor: 'pointer', borderRadius: 8, color: '#ef4444',
                    fontSize: 13, fontWeight: 600,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 14px', borderRadius: 8,
      textDecoration: 'none', fontSize: 13, fontWeight: 600,
      color: active ? '#6366f1' : 'var(--text-secondary)',
      background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
      transition: 'all 0.2s',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--accent-light)'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </Link>
  );
}
