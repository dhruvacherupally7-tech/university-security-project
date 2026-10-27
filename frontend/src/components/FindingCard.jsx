import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User, Globe, ShieldAlert, Cpu, ExternalLink, Sparkles } from 'lucide-react';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';
import RiskScoreBadge from './RiskScoreBadge';

export default function FindingCard({ finding, onInspectEvent, onExplainFinding }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="glass-card"
      style={{
        padding: '18px 20px',
        borderLeft: finding.severity === 'High' || finding.severity === 'Critical'
          ? '4px solid #ef4444'
          : finding.severity === 'Medium'
          ? '4px solid #f59e0b'
          : '4px solid #10b981',
        marginBottom: '12px',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          cursor: 'pointer',
          gap: '12px',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <RiskScoreBadge score={finding.risk_score} size="md" />
            <SeverityBadge severity={finding.severity} />
            <StatusBadge status={finding.status} />
            <span
              style={{
                fontSize: '0.74rem',
                color: '#94a3b8',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {finding.category}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              {finding.created_at ? new Date(finding.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>

          <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
            {finding.title}
          </h4>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.4 }}>
            {finding.description}
          </p>
        </div>

        <button
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px',
          }}
          aria-label={expanded ? 'Collapse finding' : 'Expand finding'}
        >
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
            }}
          >
            <div>
              <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={13} /> Target Account:
              </span>
              <strong style={{ color: '#38bdf8' }}>{finding.username || 'System-wide'}</strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Globe size={13} /> Origin IP:
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#e2e8f0' }}>{finding.ip_address || 'Internal'}</span>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Cpu size={13} /> Detection Engine:
              </span>
              <span style={{ color: '#a855f7' }}>{finding.detection_method} ({Math.round((finding.confidence || 0.85) * 100)}%)</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>
              Audit Evidence & Artifacts
            </div>
            <div
              style={{
                backgroundColor: '#090d16',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                color: '#cbd5e1',
              }}
            >
              {finding.evidence}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            {finding.event_id && onInspectEvent && (
              <button
                onClick={() => onInspectEvent(finding.event_id)}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                <ExternalLink size={13} /> Inspect Trigger Event #{finding.event_id}
              </button>
            )}

            {onExplainFinding && (
              <button
                onClick={() => onExplainFinding(finding.id)}
                className="btn btn-primary"
                style={{ fontSize: '0.78rem', padding: '6px 14px', background: 'linear-gradient(135deg, #0284c7, #06b6d4)' }}
              >
                <Sparkles size={13} /> AI Alert Explanation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
