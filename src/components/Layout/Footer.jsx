import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, Clock, AlertTriangle, ExternalLink } from 'lucide-react';

const DPO_INFO = {
  name: 'Mr. Rajesh Kumar',
  title: 'Data Protection Officer',
  email: 'dpo@techcorp.in',
  phone: '+91-98765-43210',
  responseTime: '30 days (DPDP Act Section 8(10))',
};

const GRIEVANCE_OFFICER = {
  name: 'Ms. Priya Sharma',
  title: 'Grievance Redressal Officer',
  email: 'grievance@techcorp.in',
  phone: '+91-98765-43211',
  responseTime: '30 days from receipt',
};

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      padding: '48px 40px 24px',
      marginLeft: 'var(--sidebar-width)',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '40px',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={20} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
              GrievanceShield
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
            DPDP Act Section 8(10) compliant Grievance Redressal System for TechCorp Pvt. Ltd.
          </p>
          {/* Report button */}
          <Link to="/submit-grievance" className="btn-report" style={{ display: 'inline-flex' }}>
            <AlertTriangle size={16} />
            Report Privacy Incident
          </Link>
        </div>

        {/* DPO Contact */}
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>
            Data Protection Officer
          </h4>
          <ContactBlock officer={DPO_INFO} />
        </div>

        {/* Grievance Officer */}
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>
            Grievance Officer
          </h4>
          <ContactBlock officer={GRIEVANCE_OFFICER} />
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>
            Quick Links
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { to: '/privacy-policy', label: 'Privacy Policy' },
              { to: '/submit-grievance', label: 'Submit Grievance' },
              { to: '/dashboard', label: 'My Grievances' },
            ].map(link => (
              <Link key={link.to} to={link.to} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <ExternalLink size={13} /> {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: '1px solid var(--border)',
        marginTop: 40, paddingTop: 20,
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
        maxWidth: 1200, margin: '40px auto 0',
      }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} TechCorp Pvt. Ltd. All rights reserved.
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Compliant with DPDP Act 2023 — Section 8(10) Grievance Redressal
        </p>
      </div>
    </footer>
  );
}

function ContactBlock({ officer }) {
  return (
    <div>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{officer.name}</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{officer.title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <a href={`mailto:${officer.email}`} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: '#6366f1', textDecoration: 'none', fontSize: 13,
        }}>
          <Mail size={14} /> {officer.email}
        </a>
        <a href={`tel:${officer.phone}`} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13,
        }}>
          <Phone size={14} /> {officer.phone}
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <Clock size={14} /> {officer.responseTime}
        </div>
      </div>
    </div>
  );
}
