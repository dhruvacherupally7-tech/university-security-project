import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export default function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();

  if (s === 'passed' || s === 'resolved' || s === 'active' || s === 'healthy') {
    return (
      <span className="badge badge-passed">
        <CheckCircle2 size={12} />
        {status}
      </span>
    );
  }

  if (s === 'warning' || s === 'investigating') {
    return (
      <span className="badge badge-warning">
        <AlertTriangle size={12} />
        {status}
      </span>
    );
  }

  if (s === 'failed' || s === 'error') {
    return (
      <span className="badge badge-failed">
        <XCircle size={12} />
        {status}
      </span>
    );
  }

  return (
    <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.2)', border: '1px solid rgba(100, 116, 139, 0.4)', color: '#94a3b8' }}>
      <Clock size={12} />
      {status || 'Unknown'}
    </span>
  );
}
