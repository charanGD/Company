export default function Spinner({ fullPage = false, size = 32 }) {
  const spinner = (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid rgba(99,102,241,0.2)`,
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );

  if (fullPage) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
      }}>
        {spinner}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      {spinner}
    </div>
  );
}
