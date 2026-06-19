import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Send, Paperclip, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createTicket } from '../utils/firestoreHelpers';   // now backed by PostgreSQL REST API
import Navbar from '../components/Layout/Navbar';
import Sidebar from '../components/Layout/Sidebar';
import Footer from '../components/Layout/Footer';
import toast, { Toaster } from 'react-hot-toast';


const ISSUE_TYPES = [
  'Privacy Complaint',
  'Data Correction Request',
  'Data Deletion Request',
  'Consent Withdrawal',
  'Security Incident',
  'Other',
];

const INITIAL_FORM = {
  name: '', email: '', issueType: '', description: '', attachmentUrl: '',
};

export default function SubmitGrievance() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ...INITIAL_FORM,
    name: user?.display_name || '',
    email: user?.email || '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (!form.issueType) e.issueType = 'Please select an issue type';
    if (!form.description.trim()) e.description = 'Description is required';
    else if (form.description.length < 20) e.description = 'Please describe the issue in at least 20 characters';
    else if (form.description.length > 2000) e.description = 'Description must not exceed 2000 characters';
    if (form.attachmentUrl && !/^https?:\/\/.+/.test(form.attachmentUrl)) {
      e.attachmentUrl = 'Must be a valid URL (starting with http/https)';
    }
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setSubmitting(true);
    try {
      const ticketId = await createTicket(form, user);
      setSubmitted(ticketId);
      toast.success('Grievance submitted successfully!');

      // ── Send confirmation email via Nodemailer backend ─────────────────
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_BASE}/api/send-ticket-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            ticketId,
            issueType: form.issueType,
            description: form.description,
            attachmentUrl: form.attachmentUrl || '',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.previewUrl) {
            toast((t) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontWeight: 600 }}>📧 Test Email Generated!</span>
                <a href={data.previewUrl} target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'underline' }}>
                  Click here to preview the email
                </a>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(Since no SMTP credentials were provided)</span>
              </div>
            ), { duration: 10000 });
          } else {
            toast.success(`📧 Confirmation email sent to ${form.email}`, { duration: 4000 });
          }
        } else {
          toast('📧 Ticket saved but email delivery failed. Check email server.', { icon: '⚠️' });
        }
      } catch {
        // Email server may not be running — fail silently to not block user
        console.warn('Email server unreachable. Ticket was still saved.');
        toast('📧 Ticket saved. Email server not reachable.', { icon: '⚠️' });
      }
      // ───────────────────────────────────────────────────────────────────

    } catch (err) {
      console.error(err);
      toast.error('Failed to submit. Please try again.');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="main-layout">
          <Sidebar />
          <main className="content-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 24, padding: '60px 48px', textAlign: 'center', maxWidth: 480,
              animation: 'fadeIn 0.4s ease',
            }}>
              <div style={{
                width: 80, height: 80,
                background: 'rgba(16,185,129,0.15)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <CheckCircle size={40} color="#10b981" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Grievance Submitted!</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 8 }}>
                Your ticket has been created and assigned to the DPO. You will receive a response within <strong>30 days</strong> as mandated by DPDP Act Section 8(10).
              </p>
              <div style={{
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 12, padding: '12px 20px', margin: '20px 0',
                fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#6366f1',
              }}>
                Ticket #{submitted.slice(-8).toUpperCase()}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => navigate('/dashboard')} className="btn-primary">
                  View Dashboard
                </button>
                <button onClick={() => { setSubmitted(null); setForm({ ...INITIAL_FORM, name: user?.display_name || '', email: user?.email || '' }); }} className="btn-secondary">
                  Submit Another
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <Toaster position="top-right" />
      <div className="main-layout">
        <Sidebar />
        <main className="content-area">
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, background: 'rgba(239,68,68,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={20} color="#ef4444" />
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800 }}>Submit Privacy Grievance</h1>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Your grievance will be reviewed by our Data Protection Officer within 30 days (DPDP Act Section 8(10)).
              </p>
            </div>

            {/* Form Card */}
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 20, padding: 36,
            }}>
              <form onSubmit={handleSubmit} noValidate>
                {/* Name + Email Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 0 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      name="name" value={form.name}
                      onChange={handleChange}
                      placeholder="Your full legal name"
                    />
                    {errors.name && <p className="form-error">{errors.name}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      name="email" type="email" value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="form-error">{errors.email}</p>}
                  </div>
                </div>

                {/* Issue Type */}
                <div className="form-group">
                  <label className="form-label">Issue Type *</label>
                  <select
                    className={`form-select ${errors.issueType ? 'error' : ''}`}
                    name="issueType" value={form.issueType}
                    onChange={handleChange}
                    style={{ backgroundImage: 'none' }}
                  >
                    <option value="">— Select issue type —</option>
                    {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.issueType && <p className="form-error">{errors.issueType}</p>}
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Description *</span>
                    <span style={{ fontWeight: 400, textTransform: 'none', color: form.description.length > 1800 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {form.description.length}/2000
                    </span>
                  </label>
                  <textarea
                    className={`form-textarea ${errors.description ? 'error' : ''}`}
                    name="description" value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the privacy issue in detail. Include dates, what data was affected, and any other relevant information..."
                    rows={6}
                    maxLength={2000}
                  />
                  {errors.description && <p className="form-error">{errors.description}</p>}
                </div>

                {/* Attachment URL */}
                <div className="form-group">
                  <label className="form-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Paperclip size={13} /> Attachment URL (Optional)
                    </span>
                  </label>
                  <input
                    className={`form-input ${errors.attachmentUrl ? 'error' : ''}`}
                    name="attachmentUrl" value={form.attachmentUrl}
                    onChange={handleChange}
                    placeholder="https://drive.google.com/... or any publicly accessible link"
                  />
                  {errors.attachmentUrl && <p className="form-error">{errors.attachmentUrl}</p>}
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    Upload your file to Google Drive or Dropbox and paste the shareable link here.
                  </p>
                </div>

                {/* Info Box */}
                <div style={{
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 12, padding: '14px 16px', marginBottom: 24,
                }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    📌 <strong>DPDP Act 2023 — Section 8(10):</strong> Your grievance will be acknowledged immediately and resolved within <strong>30 calendar days</strong>. The DPO will contact you at the provided email address.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? (
                    <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Submitting...</>
                  ) : (
                    <><Send size={16} /> Submit Grievance</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
