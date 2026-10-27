import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  title = 'Backend Unavailable',
  message = 'Unable to connect to Security SOC backend.',
  onRetry,
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
        gap: '16px',
        textAlign: 'center',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        width: '100%',
        minHeight: '260px',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f87171',
        }}
      >
        <AlertCircle size={28} />
      </div>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
          {title}
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary"
          style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={15} />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}
