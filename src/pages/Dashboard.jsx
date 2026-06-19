import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FilePlus, Search, Ticket, Clock, CheckCircle,
  AlertCircle, BarChart3, RefreshCw,
} from 'lucide-react';
import { apiGet } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Navbar from '../components/Layout/Navbar';
import Sidebar from '../components/Layout/Sidebar';
import Footer from '../components/Layout/Footer';

const STATUSES = ['All', 'Open', 'In Progress', 'Awaiting User Confirmation', 'Closed', 'Reopened'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('All');
  const [search, setSearch]       = useState('');
  const [fetchError, setFetchError] = useState('');

  const fetchTickets = async () => {
    if (!user) return;
    setLoading(true);
    setFetchError('');
    try {
      const data = await apiGet('/api/tickets');
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err.message);
      setFetchError(err.message || 'Failed to load tickets.');
    }
    setLoading(false);
  };

  useEffect(() => { if (user) fetchTickets(); }, [user]);

  const filtered = tickets.filter(t => {
    const matchStatus = filter === 'All' || t.status === filter;
    const matchSearch = !search
      || t.name?.toLowerCase().includes(search.toLowerCase())
      || t.issue_type?.toLowerCase().includes(search.toLowerCase())
      || t.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
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
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>My Grievances</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Track all your privacy grievance tickets
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={fetchTickets} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', background: 'var(--bg-secondary)',
                border: '1px solid var(--border)', borderRadius: 10,
                color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>
                <RefreshCw size={15} /> Refresh
              </button>
              <Link to="/submit-grievance" className="btn-primary">
                <FilePlus size={16} /> New Grievance
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 32 }}>
            <StatCard label="Total"       value={tickets.length}             icon={Ticket}       color="#6366f1" />
            <StatCard label="Open"        value={counts['Open'] || 0}        icon={AlertCircle}  color="#3b82f6" />
            <StatCard label="In Progress" value={counts['In Progress'] || 0} icon={Clock}        color="#f59e0b" />
            <StatCard label="Awaiting Confirmation" value={counts['Awaiting User Confirmation'] || 0} icon={CheckCircle}  color="#10b981" />
          </div>

          {/* Filters + Search */}
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 20, marginBottom: 24,
            display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
          }}>
            <div className="filter-tabs" style={{ flex: 1 }}>
              {STATUSES.map(s => (
                <button
                  key={s}
                  className={`filter-tab ${filter === s ? 'active' : ''}`}
                  onClick={() => setFilter(s)}
                >
                  {s} {s !== 'All' && counts[s] !== undefined && `(${counts[s]})`}
                </button>
              ))}
            </div>
            <div className="search-wrapper" style={{ minWidth: 220 }}>
              <Search size={16} className="search-icon" />
              <input
                className="form-input"
                placeholder="Search tickets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 42 }}
              />
            </div>
          </div>

          {/* Error Banner */}
          {fetchError && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12, padding: '14px 18px', marginBottom: 20,
              color: '#ef4444', fontSize: 13, lineHeight: 1.6,
            }}>
              <strong>⚠️ Error:</strong> {fetchError}
            </div>
          )}

          {/* Table */}
          {loading ? <Spinner /> : (
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 16, overflow: 'hidden',
            }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                  <BarChart3 size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    No grievances found
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
                    {tickets.length === 0 ? "You haven't submitted any grievances yet." : 'No tickets match your filter.'}
                  </p>
                  {tickets.length === 0 && (
                    <Link to="/submit-grievance" className="btn-primary">
                      <FilePlus size={16} /> Submit your first grievance
                    </Link>
                  )}
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Issue Type</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(ticket => (
                      <tr key={ticket.id} onClick={() => navigate(`/ticket/${ticket.id}`)}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                            #{ticket.id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{ticket.issue_type}</td>
                        <td style={{ color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ticket.description}
                        </td>
                        <td><Badge status={ticket.status} /></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{ticket.assigned_to}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {ticket.created_at
                            ? new Date(ticket.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
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

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</p>
    </div>
  );
}
