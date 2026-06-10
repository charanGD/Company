import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ArrowLeft, Clock, User, Paperclip, MessageSquare } from 'lucide-react';
import { db } from '../firebase';
import Navbar from '../components/Layout/Navbar';
import Sidebar from '../components/Layout/Sidebar';
import Footer from '../components/Layout/Footer';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'grievance_tickets', id));
        if (snap.exists()) setTicket({ id: snap.id, ...snap.data() });
        const q = query(
          collection(db, 'audit_logs'),
          where('ticketId', '==', id),
          orderBy('timestamp', 'asc')
        );
        const logsSnap = await getDocs(q);
        setAuditLogs(logsSnap.docs.map(d => d.data()));
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="page-container"><Navbar /><div className="main-layout"><Sidebar /><main className="content-area"><Spinner /></main></div></div>;
  if (!ticket) return <div className="page-container"><Navbar /><div className="main-layout"><Sidebar /><main className="content-area"><p>Ticket not found.</p></main></div></div>;

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
                  {ticket.isTest && <span style={{ fontSize: 11, background: 'rgba(168,85,247,0.15)', color: '#a855f7', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>TEST</span>}
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800 }}>{ticket.issueType}</h1>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
              {/* Main */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Description */}
                <Card title="Description">
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {ticket.description}
                  </p>
                </Card>

                {/* Attachment */}
                {ticket.attachmentUrl && (
                  <Card title="Attachment">
                    <a href={ticket.attachmentUrl} target="_blank" rel="noreferrer" style={{
                      display: 'flex', alignItems: 'center', gap: 8, color: '#6366f1', textDecoration: 'none', fontSize: 14,
                    }}>
                      <Paperclip size={16} /> {ticket.attachmentUrl}
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
                            {r.by} · {new Date(r.at).toLocaleString('en-IN')}
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
                            by {log.performedBy} · {log.timestamp?.toDate?.()?.toLocaleString('en-IN') || 'Just now'}
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
                  <InfoRow icon={User} label="Submitted By" value={ticket.name} />
                  <InfoRow icon={MessageSquare} label="Email" value={ticket.email} />
                  <InfoRow icon={User} label="Assigned To" value={ticket.assignedTo} highlight />
                  <InfoRow icon={Clock} label="Created" value={ticket.createdAt?.toDate?.()?.toLocaleString('en-IN') || '—'} />
                  <InfoRow icon={Clock} label="Last Updated" value={ticket.updatedAt?.toDate?.()?.toLocaleString('en-IN') || '—'} />
                </Card>

                <div style={{
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 12, padding: 16,
                }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    🕐 Under DPDP Act Section 8(10), you will receive a response within <strong>30 days</strong> from ticket creation.
                  </p>
                  {ticket.createdAt && (() => {
                    const due = new Date(ticket.createdAt.toDate());
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
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 24,
    }}>
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
