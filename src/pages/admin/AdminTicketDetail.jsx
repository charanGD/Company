import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import {
  ArrowLeft, Save, MessageSquare, UserCheck,
  Clock, Paperclip, CheckCircle2, User, AlertCircle,
} from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { updateTicketStatus, addRemark, assignTicket } from '../../utils/firestoreHelpers';
import Navbar from '../../components/Layout/Navbar';
import Sidebar from '../../components/Layout/Sidebar';
import Footer from '../../components/Layout/Footer';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import toast, { Toaster } from 'react-hot-toast';

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function AdminTicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newStatus, setNewStatus] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [remark, setRemark] = useState('');
  const [remarkModal, setRemarkModal] = useState(false);

  const loadData = async () => {
    try {
      const snap = await getDoc(doc(db, 'grievance_tickets', id));
      if (snap.exists()) {
        const d = { id: snap.id, ...snap.data() };
        setTicket(d);
        setNewStatus(d.status);
        setNewAssignee(d.assignedTo);
      }
      const q = query(collection(db, 'audit_logs'), where('ticketId', '==', id), orderBy('timestamp', 'asc'));
      const logsSnap = await getDocs(q);
      setAuditLogs(logsSnap.docs.map(d => d.data()));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = [];
      if (newStatus !== ticket.status) {
        promises.push(updateTicketStatus(id, newStatus, user.email));
      }
      if (newAssignee !== ticket.assignedTo) {
        promises.push(assignTicket(id, newAssignee, user.email));
      }
      await Promise.all(promises);
      toast.success('Ticket updated successfully!');
      await loadData();
    } catch (err) {
      toast.error('Failed to update ticket.');
    }
    setSaving(false);
  };

  const handleAddRemark = async () => {
    if (!remark.trim()) return;
    setSaving(true);
    try {
      await addRemark(id, remark.trim(), user.email);
      setRemark('');
      setRemarkModal(false);
      toast.success('Remark added!');
      await loadData();
    } catch (err) {
      toast.error('Failed to add remark.');
    }
    setSaving(false);
  };

  if (loading) return <div className="page-container"><Navbar /><div className="main-layout"><Sidebar /><main className="content-area"><Spinner /></main></div></div>;
  if (!ticket) return <div className="page-container"><Navbar /><div className="main-layout"><Sidebar /><main className="content-area"><p style={{ color: 'var(--text-muted)' }}>Ticket not found.</p></main></div></div>;

  return (
    <div className="page-container">
      <Navbar />
      <Toaster position="top-right" />
      <div className="main-layout">
        <Sidebar />
        <main className="content-area">
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {/* Back */}
            <button onClick={() => navigate('/admin')} style={{
              display: 'flex', alignItems: 'center', gap: 8, background: 'transparent',
              border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, marginBottom: 24,
            }}>
              <ArrowLeft size={16} /> Back to Admin Dashboard
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '4px 10px', borderRadius: 8 }}>
                    #{ticket.id.slice(-8).toUpperCase()}
                  </span>
                  <Badge status={ticket.status} />
                  {ticket.isTest && <span style={{ fontSize: 11, background: 'rgba(168,85,247,0.15)', color: '#a855f7', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>TEST</span>}
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800 }}>{ticket.issueType}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                  Submitted by {ticket.name} · {ticket.email}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setRemarkModal(true)} className="btn-secondary">
                  <MessageSquare size={15} /> Add Remark
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || (newStatus === ticket.status && newAssignee === ticket.assignedTo)}
                  className="btn-primary"
                  style={{ opacity: (saving || (newStatus === ticket.status && newAssignee === ticket.assignedTo)) ? 0.5 : 1 }}
                >
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
              {/* Left */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Description */}
                <AdminCard title="Description">
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {ticket.description}
                  </p>
                </AdminCard>

                {ticket.attachmentUrl && (
                  <AdminCard title="Attachment">
                    <a href={ticket.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6366f1', textDecoration: 'none', fontSize: 13 }}>
                      <Paperclip size={15} /> {ticket.attachmentUrl}
                    </a>
                  </AdminCard>
                )}

                {/* Remarks */}
                <AdminCard title={`DPO Remarks (${ticket.remarks?.length || 0})`}>
                  {(!ticket.remarks || ticket.remarks.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No remarks added yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {ticket.remarks.map((r, i) => (
                        <div key={i} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                          <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 6 }}>{r.text}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {r.by} · {new Date(r.at).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </AdminCard>

                {/* Audit Logs */}
                <AdminCard title="Full Audit Trail">
                  {auditLogs.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No activity logged.</p>
                  ) : (
                    <div className="timeline">
                      {auditLogs.map((log, i) => (
                        <div key={i} className="timeline-item">
                          <div className="timeline-dot" style={{ background: i === auditLogs.length - 1 ? '#10b981' : '#6366f1' }} />
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{log.action}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            by {log.performedBy} · {log.timestamp?.toDate?.()?.toLocaleString('en-IN') || 'Just now'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </AdminCard>
              </div>

              {/* Right Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Status */}
                <AdminCard title="Change Status">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {STATUSES.map(s => (
                      <button
                        key={s}
                        onClick={() => setNewStatus(s)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderRadius: 10,
                          border: `1px solid ${newStatus === s ? '#6366f1' : 'var(--border)'}`,
                          background: newStatus === s ? 'rgba(99,102,241,0.12)' : 'transparent',
                          cursor: 'pointer', fontSize: 13, fontWeight: 600,
                          color: newStatus === s ? '#6366f1' : 'var(--text-secondary)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {newStatus === s ? <CheckCircle2 size={16} color="#6366f1" /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border)' }} />}
                        {s}
                      </button>
                    ))}
                  </div>
                </AdminCard>

                {/* Assign */}
                <AdminCard title="Assign To">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input
                      className="form-input"
                      value={newAssignee}
                      onChange={e => setNewAssignee(e.target.value)}
                      placeholder="Officer name or email"
                    />
                  </div>
                </AdminCard>

                {/* Ticket Info */}
                <AdminCard title="Ticket Info">
                  <InfoRow icon={User} label="Submitted By" value={ticket.name} />
                  <InfoRow icon={MessageSquare} label="Email" value={ticket.email} />
                  <InfoRow icon={Clock} label="Created" value={ticket.createdAt?.toDate?.()?.toLocaleString('en-IN') || '—'} />
                  <InfoRow icon={Clock} label="Updated" value={ticket.updatedAt?.toDate?.()?.toLocaleString('en-IN') || '—'} />
                  <InfoRow icon={UserCheck} label="Current Assignee" value={ticket.assignedTo} highlight />
                </AdminCard>

                {/* SLA */}
                {ticket.createdAt && (() => {
                  const due = new Date(ticket.createdAt.toDate());
                  due.setDate(due.getDate() + 30);
                  const daysLeft = Math.max(0, Math.ceil((due - new Date()) / 86400000));
                  const overdue = daysLeft === 0 && ticket.status !== 'Resolved' && ticket.status !== 'Closed';
                  return (
                    <div style={{
                      background: overdue ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                      border: `1px solid ${overdue ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                      borderRadius: 12, padding: 16,
                    }}>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>DPDP SLA Status</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: overdue ? '#ef4444' : '#10b981' }}>
                        {overdue ? '⚠ OVERDUE' : `${daysLeft} days left`}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        Due: {due.toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Remark Modal */}
          <Modal isOpen={remarkModal} onClose={() => setRemarkModal(false)} title="Add Remark">
            <div className="form-group">
              <label className="form-label">Remark / Response</label>
              <textarea
                className="form-textarea"
                value={remark}
                onChange={e => setRemark(e.target.value)}
                placeholder="Enter your remark or response to the data principal..."
                rows={5}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setRemarkModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAddRemark} disabled={!remark.trim() || saving} className="btn-primary">
                <MessageSquare size={15} /> {saving ? 'Adding...' : 'Add Remark'}
              </button>
            </div>
          </Modal>
        </main>
      </div>
      <Footer />
    </div>
  );
}

function AdminCard({ title, children }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>{title}</h3>
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
