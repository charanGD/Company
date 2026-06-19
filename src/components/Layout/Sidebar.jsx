import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, ShieldCheck, Settings,
  Cpu, ScanSearch, Wand2, TestTube2, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const USER_LINKS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'My Grievances' },
  { to: '/submit-grievance', icon: FilePlus, label: 'Submit Grievance' },
  { to: '/privacy-policy', icon: ShieldCheck, label: 'Privacy Policy' },
];

// We will render this explicitly in the component now for dynamic role labeling
const ADMIN_LINKS = [];

const AI_LINKS = [
  { to: '/ai/scanner', icon: ScanSearch, label: 'Compliance Scanner' },
  { to: '/ai/generator', icon: Wand2, label: 'Form Generator' },
  { to: '/ai/tester', icon: TestTube2, label: 'Ticket Tester' },
];

export default function Sidebar() {
  const { role } = useAuth();
  const location = useLocation();

  return (
    <aside style={{
      position: 'fixed',
      top: 'var(--navbar-height)',
      left: 0,
      width: 'var(--sidebar-width)',
      height: 'calc(100vh - var(--navbar-height))',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      padding: '20px 12px',
      overflowY: 'auto',
      zIndex: 90,
    }}>
      {role === 'user' && (
        <SideSection label="User">
          {USER_LINKS.map(l => <SideItem key={l.to} {...l} active={location.pathname === l.to} />)}
        </SideSection>
      )}

      {['admin', 'staff'].includes(role) && (
        <SideSection label={role === 'staff' ? 'Staff' : 'Administration'}>
          <SideItem 
            to="/admin" 
            icon={Settings} 
            label={role === 'staff' ? 'Staff Dashboard' : 'Admin Dashboard'} 
            active={location.pathname.startsWith('/admin')} 
          />
        </SideSection>
      )}

      {role === 'admin' && (
        <SideSection label="AI Utilities">
          {AI_LINKS.map(l => <SideItem key={l.to} {...l} active={location.pathname === l.to} />)}
        </SideSection>
      )}
    </aside>
  );
}

function SideSection({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--text-muted)',
        padding: '0 12px', marginBottom: 6,
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function SideItem({ to, icon: Icon, label, active }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 10,
      textDecoration: 'none', fontSize: 13, fontWeight: 600,
      color: active ? 'white' : 'var(--text-secondary)',
      background: active
        ? 'linear-gradient(135deg,#6366f1,#4f46e5)'
        : 'transparent',
      transition: 'all 0.2s',
      marginBottom: 2,
      justifyContent: 'space-between',
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon size={16} /> {label}
      </span>
      {active && <ChevronRight size={14} />}
    </Link>
  );
}
