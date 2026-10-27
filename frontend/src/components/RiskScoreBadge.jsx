import React from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';

export function getRiskColor(score) {
  if (score >= 80) return { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', level: 'CRITICAL' };
  if (score >= 60) return { text: '#ea580c', bg: 'rgba(234, 88, 12, 0.15)', border: 'rgba(234, 88, 12, 0.4)', level: 'HIGH' };
  if (score >= 30) return { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', level: 'MEDIUM' };
  return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', level: 'LOW' };
}

export default function RiskScoreBadge({ score = 50, size = 'md', showLevel = true }) {
  const safeScore = Math.min(Math.max(Number(score) || 0, 0), 100);
  const colorInfo = getRiskColor(safeScore);

  if (size === 'lg') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          borderRadius: '10px',
          backgroundColor: colorInfo.bg,
          border: `1.5px solid ${colorInfo.border}`,
          boxShadow: `0 0 16px ${colorInfo.bg}`,
        }}
      >
        <div style={{ position: 'relative', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="42" height="42" viewBox="0 0 42 42">
            <circle cx="21" cy="21" r="17" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
            <circle
              cx="21"
              cy="21"
              r="17"
              fill="none"
              stroke={colorInfo.text}
              strokeWidth="3.5"
              strokeDasharray={`${(safeScore / 100) * 106.8} 106.8`}
              strokeLinecap="round"
              transform="rotate(-90 21 21)"
            />
          </svg>
          <span style={{ position: 'absolute', fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
            {safeScore}
          </span>
        </div>
        <div>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em' }}>
            Risk Score
          </div>
          {showLevel && (
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: colorInfo.text, letterSpacing: '0.02em' }}>
              {colorInfo.level}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 9px',
        borderRadius: '6px',
        backgroundColor: colorInfo.bg,
        border: `1px solid ${colorInfo.border}`,
        color: colorInfo.text,
        fontSize: '0.76rem',
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
      }}
    >
      <span style={{ fontSize: '0.82rem' }}>{safeScore}</span>
      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>/100</span>
      {showLevel && (
        <span
          style={{
            marginLeft: '2px',
            padding: '1px 5px',
            borderRadius: '4px',
            backgroundColor: 'rgba(0,0,0,0.25)',
            fontSize: '0.65rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
          }}
        >
          {colorInfo.level}
        </span>
      )}
    </div>
  );
}
