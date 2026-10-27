import React from 'react';
import { AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SeverityBadge({ severity }) {
  const sev = (severity || 'Low').toLowerCase();

  if (sev === 'high' || sev === 'critical') {
    return (
      <span className="badge badge-high">
        <AlertCircle size={12} />
        {severity || 'High'}
      </span>
    );
  }

  if (sev === 'medium') {
    return (
      <span className="badge badge-medium">
        <AlertTriangle size={12} />
        {severity || 'Medium'}
      </span>
    );
  }

  return (
    <span className="badge badge-low">
      <ShieldCheck size={12} />
      {severity || 'Low'}
    </span>
  );
}
