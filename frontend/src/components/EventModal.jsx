import React from 'react';
import { X, ShieldAlert, Clock, User, Globe, FileCode, CheckCircle2 } from 'lucide-react';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';
import RiskScoreBadge from './RiskScoreBadge';

export default function EventModal({ event, onClose }) {
  if (!event) return null;

  // Compute event risk score from actual severity and status code
  const eventRisk =
    event.severity === 'CRITICAL' ? 88 :
    event.severity === 'HIGH' ? (event.status_code >= 400 ? 78 : 68) :
    event.severity === 'MEDIUM' ? (event.status_code >= 400 ? 55 : 42) : 22;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#06b6d4',
              }}
            >
              <ShieldAlert size={18} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                Security Event #{event.id}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                {event.event_type}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Key Status Row */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                Event Risk
              </div>
              <RiskScoreBadge score={eventRisk} size="sm" />
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                Severity
              </div>
              <SeverityBadge severity={event.severity} />
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                HTTP Status
              </div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: event.status_code >= 400 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: event.status_code >= 400 ? '#f87171' : '#34d399',
                  border: `1px solid ${event.status_code >= 400 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                }}
              >
                {event.status_code}
              </span>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                Pipeline Status
              </div>
              <span className="badge badge-passed">
                <CheckCircle2 size={12} />
                {event.processed ? 'Processed & Correlated' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '10px',
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                <Clock size={13} /> Timestamp
              </div>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
                {event.timestamp ? new Date(event.timestamp).toLocaleString() : '—'}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                <User size={13} /> Username
              </div>
              <div style={{ fontSize: '0.88rem', color: '#38bdf8', fontWeight: 600 }}>
                {event.username}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                <Globe size={13} /> Source IP Address
              </div>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
                {event.ip_address}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                <FileCode size={13} /> Targeted Resource
              </div>
              <div style={{ fontSize: '0.85rem', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                {event.resource}
              </div>
            </div>
          </div>

          {/* Log Message */}
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Normalized Log Message
            </div>
            <div
              style={{
                backgroundColor: '#090d16',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                color: '#cbd5e1',
                lineHeight: 1.6,
                wordBreak: 'break-all',
              }}
            >
              {event.message}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
