const STATUS_CONFIG = {
  Open:        { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', dot: '#3b82f6' },
  'In Progress':{ bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', dot: '#f59e0b' },
  Resolved:    { bg: 'rgba(16,185,129,0.15)', color: '#10b981', dot: '#10b981' },
  Closed:      { bg: 'rgba(100,116,139,0.15)', color: '#64748b', dot: '#64748b' },
  Test:        { bg: 'rgba(168,85,247,0.15)', color: '#a855f7', dot: '#a855f7' },
};

export default function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Open'];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      background: cfg.bg,
      color: cfg.color,
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}
