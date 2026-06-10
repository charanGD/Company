import { Link } from 'react-router-dom';
import {
  Shield, Mail, Phone, Clock, AlertTriangle,
  CheckCircle, ChevronRight, FileText, Users, Scale,
} from 'lucide-react';
import Navbar from '../components/Layout/Navbar';
import Sidebar from '../components/Layout/Sidebar';
import Footer from '../components/Layout/Footer';

const DPO = {
  name: 'Mr. Rajesh Kumar',
  title: 'Data Protection Officer (DPO)',
  email: 'dpo@techcorp.in',
  phone: '+91-98765-43210',
  address: 'TechCorp Pvt. Ltd., 4th Floor, Cyber Tower, Hitech City, Hyderabad – 500081',
  response: 'Within 30 days of receipt (DPDP Act Section 8(10))',
};

const GRIEVANCE_OFFICER = {
  name: 'Ms. Priya Sharma',
  title: 'Grievance Redressal Officer',
  email: 'grievance@techcorp.in',
  phone: '+91-98765-43211',
  response: 'Within 30 days of receipt',
};

export default function PrivacyPolicy() {
  const sections = [
    { id: 'overview', title: '1. Overview', icon: Shield },
    { id: 'data-collected', title: '2. Data We Collect', icon: FileText },
    { id: 'purpose', title: '3. Purpose of Processing', icon: Scale },
    { id: 'rights', title: '4. Your Rights (DPDP Act)', icon: CheckCircle },
    { id: 'grievance', title: '5. Grievance Redressal', icon: AlertTriangle },
    { id: 'dpo', title: '6. DPO & Officers Contact', icon: Users },
  ];

  return (
    <div className="page-container">
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="content-area">
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {/* Hero */}
            <div style={{
              background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.08))',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 24, padding: '48px 40px', marginBottom: 40, textAlign: 'center',
            }}>
              <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 16px 40px rgba(99,102,241,0.4)' }}>
                <Shield size={32} color="white" />
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
                Privacy Policy
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 540, margin: '0 auto 24px', lineHeight: 1.7 }}>
                TechCorp Pvt. Ltd. — Compliant with the Digital Personal Data Protection (DPDP) Act 2023
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Last Updated: June 1, 2025 · Effective Date: January 1, 2024
              </p>

              {/* CTA */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
                <Link to="/submit-grievance" className="btn-report">
                  <AlertTriangle size={16} />
                  Report Privacy Incident
                </Link>
                <Link to="/dashboard" className="btn-secondary">
                  View My Tickets <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {/* TOC */}
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 24, marginBottom: 32,
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>
                Table of Contents
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {sections.map(({ id, title, icon: Icon }) => (
                  <a key={id} href={`#${id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13, padding: '6px 0',
                  }}>
                    <Icon size={14} color="#6366f1" /> {title}
                  </a>
                ))}
              </div>
            </div>

            {/* Sections */}
            <PolicySection id="overview" title="1. Overview">
              <p>TechCorp Pvt. Ltd. (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;) is committed to protecting the personal data of all data principals in accordance with the Digital Personal Data Protection (DPDP) Act, 2023 of India. This Privacy Policy explains how we collect, use, store, and protect your personal data, and describes your rights under this Act.</p>
            </PolicySection>

            <PolicySection id="data-collected" title="2. Data We Collect">
              <ul style={{ paddingLeft: 20, lineHeight: 2, color: 'var(--text-secondary)' }}>
                <li><strong>Identity Data:</strong> Full name, date of birth, gender</li>
                <li><strong>Contact Data:</strong> Email address, phone number, mailing address</li>
                <li><strong>Account Data:</strong> Login credentials, authentication tokens</li>
                <li><strong>Usage Data:</strong> IP address, browser type, pages visited, time spent</li>
                <li><strong>Communications:</strong> Grievances, support messages, feedback</li>
              </ul>
            </PolicySection>

            <PolicySection id="purpose" title="3. Purpose of Processing">
              <p style={{ marginBottom: 12 }}>We process personal data for the following lawful purposes:</p>
              <ul style={{ paddingLeft: 20, lineHeight: 2, color: 'var(--text-secondary)' }}>
                <li>Providing and improving our services</li>
                <li>Processing and responding to grievances (DPDP Act Section 8)</li>
                <li>Compliance with legal and regulatory obligations</li>
                <li>Fraud prevention and security monitoring</li>
                <li>Communicating product updates and support</li>
              </ul>
            </PolicySection>

            <PolicySection id="rights" title="4. Your Rights under DPDP Act 2023">
              {[
                ['Right to Access', 'Request a copy of personal data we hold about you (Section 11)'],
                ['Right to Correction', 'Request correction of inaccurate or incomplete data (Section 12)'],
                ['Right to Erasure', 'Request deletion of your personal data where applicable (Section 12)'],
                ['Right to Grievance Redressal', 'Lodge a complaint if your rights are violated (Section 13)'],
                ['Right to Withdraw Consent', 'Withdraw previously given consent at any time (Section 6)'],
                ['Right to Nominate', 'Nominate another individual to exercise rights on your behalf (Section 14)'],
              ].map(([right, desc]) => (
                <div key={right} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{right}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </PolicySection>

            <PolicySection id="grievance" title="5. Grievance Redressal (Section 8(10))">
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                  As per <strong>Section 8(10) of the DPDP Act 2023</strong>, every data fiduciary shall establish an effective mechanism to redress the grievances of data principals. All grievances shall be acknowledged within <strong>48 hours</strong> and resolved within <strong>30 calendar days</strong>.
                </p>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
                To submit a privacy grievance, click the button below or contact our Grievance Officer directly. You may also escalate unresolved complaints to the <strong>Data Protection Board of India</strong>.
              </p>
              <Link to="/submit-grievance" className="btn-report" style={{ display: 'inline-flex' }}>
                <AlertTriangle size={16} /> Report Privacy Incident
              </Link>
            </PolicySection>

            <PolicySection id="dpo" title="6. DPO & Grievance Officer Contact">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <OfficerCard officer={DPO} type="DPO" />
                <OfficerCard officer={GRIEVANCE_OFFICER} type="Grievance" />
              </div>
            </PolicySection>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

function PolicySection({ id, title, children }) {
  return (
    <div id={id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, marginBottom: 20 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>{title}</h2>
      <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>{children}</div>
    </div>
  );
}

function OfficerCard({ officer, type }) {
  return (
    <div style={{
      background: 'var(--bg-primary)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, background: 'rgba(99,102,241,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={18} color="#6366f1" />
        </div>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{type}</p>
          <p style={{ fontSize: 15, fontWeight: 800 }}>{officer.name}</p>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>{officer.title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a href={`mailto:${officer.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6366f1', textDecoration: 'none', fontSize: 13 }}>
          <Mail size={14} /> {officer.email}
        </a>
        <a href={`tel:${officer.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13 }}>
          <Phone size={14} /> {officer.phone}
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <Clock size={14} /> {officer.response}
        </div>
        {officer.address && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 4 }}>{officer.address}</p>
        )}
      </div>
    </div>
  );
}
