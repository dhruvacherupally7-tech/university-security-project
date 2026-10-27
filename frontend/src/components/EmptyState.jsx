import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  title = 'No Data Found',
  message = 'There are no active records matching the selected parameters.',
  action,
}) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '50px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        textAlign: 'center',
        width: '100%',
        minHeight: '220px',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
        }}
      >
        <Inbox size={24} />
      </div>
      <div>
        <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>
          {title}
        </h4>
        <p style={{ color: '#64748b', fontSize: '0.84rem', maxWidth: '380px' }}>
          {message}
        </p>
      </div>
      {action}
    </div>
  );
}
