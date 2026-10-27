import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading security events...' }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '60px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        textAlign: 'center',
        width: '100%',
        minHeight: '260px',
      }}
    >
      <Loader2
        size={36}
        color="#06b6d4"
        style={{
          animation: 'spin 1s linear infinite',
        }}
      />
      <div style={{ color: '#94a3b8', fontSize: '0.92rem', fontWeight: 500 }}>
        {message}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
