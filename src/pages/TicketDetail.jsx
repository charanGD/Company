import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Paperclip, MessageSquare, Check, X } from 'lucide-react';
import { apiGet, apiPost } from '../api/client';
import Navbar from '../components/Layout/Navbar';
import Sidebar from '../components/Layout/Sidebar';
import Footer from '../components/Layout/Footer';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket]       = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  const handleAcknowledge = async (accepted) => {
    if (!accepted && !rejectMode) {
      setRejectMode(true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiPost(`/api/tickets/${id}/acknowledge`, {
        accepted,
        comment: rejectComment
      });
      setTicket(res);
      const logs = await apiGet(`/api/tickets/${id}/audit`);
      setAuditLogs(logs);
      setRejectMode(false);
      setRejectComment('');
    } catch (err) {
      console.error(err);
    }
    setActionLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [t, logs] = await Promise.all([
          apiGet(`/api/tickets/${id}`),
          apiGet(`/api/tickets/${id}/audit`),
        ]);
        setTicket(t);
        setAuditLogs(logs);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="page-container"><Navbar /><div className="main-layout"><Sidebar /><main className="content-area"><Spinner /></main></div></div>;
  if (!ticket)  return <div className="page-container"><Navbar /><div className="main-layout"><Sidebar /><main className="content-area"><p>Ticket not found.</p></main></div></div>;

  return (
    <div className="page-container">
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="content-area">
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            {/* Back */}
            <button onClick={() => navigate('/dashboard')} style={{
              display: 'flex', alignItems: 'center', gap: 8, background: 'transparent',
              border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, marginBottom: 24,
            }}>
              <ArrowLeft size={16} /> Back to Dashboard
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '4px 10px', borderRadius: 8 }}>
                    #{ticket.id.slice(-8).toUpperCase()}
                  </span>
                  <Badge status={ticket.status} />
                  {ticket.is_test && <span style={{ fontSize: 11, background: 'rgba(168,85,247,0.15)', color: '#a855f7', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>TEST</span>}
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800 }}>{ticket.issue_type}</h1>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
              {/* Main */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Action Required */}
                {ticket.status === 'Awaiting User Confirmation' && (
                  <Card title="Action Required">
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Check size={16} /> DPO Resolution
                      </p>
                      <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {ticket.resolution_message || "No resolution message provided."}
                      </p>
                    </div>
                    
                    {!rejectMode ? (
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => handleAcknowledge(true)} disabled={actionLoading} className="btn-primary" style={{ background: '#10b981', border: 'none' }}>
                          <Check size={16} /> {actionLoading ? 'Saving...' : 'Accept Resolution'}
                        </button>
                        <button onClick={() => handleAcknowledge(false)} disabled={actionLoading} className="btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                          <X size={16} /> Issue Still Exists
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 12 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Why is the issue not resolved? (Optional)</label>
                        <textarea
                          className="form-textarea"
                          rows={3}
                          value={rejectComment}
                          onChange={e => setRejectComment(e.target.value)}
                          placeholder="Provide details..."
                          style={{ marginBottom: 12 }}
                        />
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button onClick={() => handleAcknowledge(false)} disabled={actionLoading} className="btn-primary" style={{ background: '#ef4444', border: 'none' }}>
                            {actionLoading ? 'Submitting...' : 'Reopen Ticket'}
                          </button>
                          <button onClick={() => setRejectMode(false)} disabled={actionLoading} className="btn-secondary">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Resolution Accepted */}
                {ticket.status === 'Closed' && ticket.acknowledged_by_user && (
                   <Card title="Resolution Accepted">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(99,102,241,0.08)', padding: 16, borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)' }}>
                      <Check size={20} color="#6366f1" style={{ marginTop: 2 }} />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>You have accepted the resolution</p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>This ticket was officially closed on {ticket.closed_at ? new Date(ticket.closed_at).toLocaleString('en-IN') : new Date(ticket.updated_at).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                   </Card>
                )}

                {/* Description */}
                <Card title="Description">
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {ticket.description}
                  </p>
                </Card>

                {/* Attachment */}
                {ticket.attachment_url && (
                  <Card title="Attachment">
                    <a href={ticket.attachment_url} target="_blank" rel="noreferrer" style={{
                      display: 'flex', alignItems: 'center', gap: 8, color: '#6366f1', textDecoration: 'none', fontSize: 14,
                    }}>
                      <Paperclip size={16} /> {ticket.attachment_url}
                    </a>
                  </Card>
                )}

                {/* Remarks */}
                {ticket.remarks?.length > 0 && (
                  <Card title={`Remarks (${ticket.remarks.length})`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {ticket.remarks.map((r, i) => (
                        <div key={i} style={{
                          background: 'var(--bg-primary)', border: '1px solid var(--border)',
                          borderRadius: 10, padding: 14,
                        }}>
                          <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 6 }}>{r.text}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {r.performed_by} · {new Date(r.created_at).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Audit Timeline */}
                <Card title="Activity Timeline">
                  {auditLogs.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No activity logged yet.</p> : (
                    <div className="timeline">
                      {auditLogs.map((log, i) => (
                        <div key={i} className="timeline-item">
                          <div className="timeline-dot" />
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{log.action}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            by {log.performed_by} · {new Date(log.created_at).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Card title="Ticket Info">
                  <InfoRow icon={User}         label="Submitted By" value={ticket.name} />
                  <InfoRow icon={MessageSquare} label="Email"        value={ticket.email} />
                  <InfoRow icon={User}         label="Assigned To"  value={ticket.assigned_to} highlight />
                  <InfoRow icon={Clock}        label="Created"      value={ticket.created_at ? new Date(ticket.created_at).toLocaleString('en-IN') : '—'} />
                  <InfoRow icon={Clock}        label="Last Updated" value={ticket.updated_at ? new Date(ticket.updated_at).toLocaleString('en-IN') : '—'} />
                </Card>

                <div style={{
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 12, padding: 16,
                }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    🕐 Under DPDP Act Section 8(10), you will receive a response within <strong>30 days</strong> from ticket creation.
                  </p>
                  {ticket.created_at && (() => {
                    const due = new Date(ticket.created_at);
                    due.setDate(due.getDate() + 30);
                    const daysLeft = Math.max(0, Math.ceil((due - new Date()) / 86400000));
                    return (
                      <p style={{ fontSize: 13, fontWeight: 700, color: daysLeft < 7 ? '#ef4444' : '#10b981', marginTop: 8 }}>
                        {daysLeft > 0 ? `${daysLeft} days remaining` : 'Resolution due'}
                      </p>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <Icon size={15} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: highlight ? '#6366f1' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
      </div>
    </div>
  );
}
