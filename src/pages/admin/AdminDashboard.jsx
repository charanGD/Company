import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, RefreshCw, Ticket, Users,
  CheckCircle, Clock, AlertCircle, XCircle,
} from 'lucide-react';
import { apiGet } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Navbar from '../../components/Layout/Navbar';
import Sidebar from '../../components/Layout/Sidebar';
import Footer from '../../components/Layout/Footer';

const STATUSES    = ['All', 'Open', 'In Progress', 'Awaiting User Confirmation', 'Closed', 'Reopened'];
const ISSUE_TYPES = ['All', 'Privacy Complaint', 'Data Correction Request', 'Data Deletion Request', 'Consent Withdrawal', 'Security Incident', 'Other'];

export default function AdminDashboard() {
  const { user, role } = useAuth();
  const navigate  = useNavigate();
  const [tickets, setTickets]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter]   = useState('All');
  const [search, setSearch]           = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/tickets/all');
      setTickets(data);
    } catch (err) {
      console.error('AdminDashboard fetchTickets:', err.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const filtered = tickets.filter(t => {
    const s  = statusFilter === 'All' || t.status === statusFilter;
    const ty = typeFilter   === 'All' || t.issue_type === typeFilter;
    const q  = !search
      || t.name?.toLowerCase().includes(search.toLowerCase())
      || t.email?.toLowerCase().includes(search.toLowerCase())
      || t.id.toLowerCase().includes(search.toLowerCase())
      || t.issue_type?.toLowerCase().includes(search.toLowerCase());
    return s && ty && q;
  });

  const counts = STATUSES.slice(1).reduce((acc, s) => {
    acc[s] = tickets.filter(t => t.status === s).length;
    return acc;
  }, {});

  return (
    <div className="page-container">
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="content-area">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{role === 'staff' ? 'Staff Dashboard' : 'Admin Dashboard'}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage all grievance tickets · DPO Control Panel</p>
            </div>
            <button onClick={fetchTickets} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', background: 'var(--bg-secondary)',
              border: '1px solid var(--border)', borderRadius: 10,
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 32 }}>
            <AStatCard label="Total Tickets" value={tickets.length}             icon={Ticket}       color="#6366f1" />
            <AStatCard label="Open"          value={counts['Open'] || 0}        icon={AlertCircle}  color="#3b82f6" />
            <AStatCard label="In Progress"   value={counts['In Progress'] || 0} icon={Clock}        color="#f59e0b" />
            <AStatCard label="Awaiting Conf." value={counts['Awaiting User Confirmation'] || 0} icon={CheckCircle}  color="#10b981" />
            <AStatCard label="Closed"      value={counts['Closed'] || 0}      icon={XCircle}      color="#64748b" />
          </div>

          {/* Filters */}
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 20, marginBottom: 24,
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
                <Search size={16} className="search-icon" />
                <input
                  className="form-input"
                  placeholder="Search by name, email, ticket ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 42 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Filter size={15} color="var(--text-muted)" />
                <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 200, backgroundImage: 'none' }}>
                  {ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="filter-tabs">
              {STATUSES.map(s => (
                <button key={s} className={`filter-tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                  {s} {s !== 'All' && `(${counts[s] ?? 0})`}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? <Spinner /> : (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {filtered.length} ticket{filtered.length !== 1 ? 's' : ''} {search || statusFilter !== 'All' || typeFilter !== 'All' ? '(filtered)' : ''}
                </p>
              </div>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                  <p style={{ color: 'var(--text-muted)' }}>No tickets match the current filters.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Issue Type</th>
                      <th>Status</th>
                      <th>Assigned</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id} onClick={() => navigate(`/admin/ticket/${t.id}`)}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                            #{t.id.slice(-8).toUpperCase()}
                            {t.is_test && <span style={{ marginLeft: 6, fontSize: 10, color: '#a855f7' }}>[TEST]</span>}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.email}</td>
                        <td style={{ fontSize: 13 }}>{t.issue_type}</td>
                        <td><Badge status={t.status} /></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t.assigned_to}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {t.created_at
                            ? new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}

function AStatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="stat-card">
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon size={20} color={color} />
      </div>
      <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</p>
    </div>
  );
}
