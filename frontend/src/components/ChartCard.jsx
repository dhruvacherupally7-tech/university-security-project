import React from 'react';

export default function ChartCard({ title, subtitle, action, children }) {
  return (
    <div
      className="glass-card glow-card"
      style={{
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '340px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div style={{ flex: 1, minHeight: '240px', width: '100%', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}
