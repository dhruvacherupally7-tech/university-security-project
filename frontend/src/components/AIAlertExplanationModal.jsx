import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  ShieldAlert,
  User,
  Network,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  HelpCircle,
  FileText
} from 'lucide-react';
import api from '../services/api';
import RiskScoreBadge, { getRiskColor } from './RiskScoreBadge';
import SeverityBadge from './SeverityBadge';

export default function AIAlertExplanationModal({ findingId, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !findingId) return;

    let mounted = true;
    const fetchExplanation = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getFindingExplanation(findingId);
        if (mounted) {
          setExplanation(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to generate AI alert explanation.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchExplanation();

    return () => {
      mounted = false;
    };
  }, [isOpen, findingId]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.78)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card glow-card"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          backgroundColor: '#0c1322',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(6, 182, 212, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(15, 23, 42, 0.6))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#06b6d4' }}>
                  AI Alert Explanation Engine
                </span>
                {explanation && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '1px 7px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                    }}
                  >
                    Confidence: {explanation.confidence}%
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.25, margin: 0 }}>
                {explanation?.title || `Finding #${findingId} Analysis`}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid rgba(6, 182, 212, 0.2)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '12px' }} />
              <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>Correlating Telemetry Vectors...</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Synthesizing explainable AI alert deduction from SQLite database</div>
            </div>
          ) : error ? (
            <div style={{ padding: '20px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Analysis Unavailable</div>
              <div style={{ fontSize: '0.85rem' }}>{error}</div>
            </div>
          ) : explanation && (
            <>
              {/* Top Metrics Strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Risk Score</div>
                  <div style={{ marginTop: '4px' }}>
                    <RiskScoreBadge score={explanation.risk_score} size="md" />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Threat Severity</div>
                  <div style={{ marginTop: '4px' }}>
                    <SeverityBadge severity={explanation.severity} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Affected User</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={14} color="#06b6d4" />
                    <span>{explanation.affected_user}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Source IP</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-mono)' }}>
                    <Network size={14} color="#a855f7" />
                    <span>{explanation.source_ip}</span>
                  </div>
                </div>
              </div>

              {/* Why Was This Detected? */}
              <div
                style={{
                  backgroundColor: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                  <HelpCircle size={16} />
                  <span>Why Was This Detected?</span>
                </div>
                <div style={{ fontSize: '0.88rem', color: '#e0f2fe', lineHeight: 1.5 }}>
                  {explanation.why_detected}
                </div>
              </div>

              {/* What Happened? */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: '8px' }}>
                  Incident Breakdown
                </div>
                <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '14px 16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  {explanation.what_happened}
                </div>
              </div>

              {/* Risk Factor Breakdown */}
              {explanation.risk_factors && explanation.risk_factors.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: '8px' }}>
                    Calculated Risk Factors (0 - 100 Score Breakdown)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {explanation.risk_factors.map((rf, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255, 255, 255, 0.04)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: '#f8fafc' }}>{rf.factor}</span>
                          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>— {rf.detail}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: '#ea580c', fontFamily: 'var(--font-mono)' }}>
                          +{rf.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concrete Evidence */}
              {explanation.evidence && explanation.evidence.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: '8px' }}>
                    Correlated Evidence
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {explanation.evidence.map((ev, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          fontSize: '0.82rem',
                          color: '#e2e8f0',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          padding: '10px 14px',
                          borderRadius: '6px',
                          borderLeft: '3px solid #0ea5e9',
                        }}
                      >
                        <CheckCircle2 size={15} color="#0ea5e9" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Events Table */}
              {explanation.related_events && explanation.related_events.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: '8px' }}>
                    Related Security Telemetry Events ({explanation.related_events.length})
                  </div>
                  <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', color: '#94a3b8', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px' }}>Event ID</th>
                          <th style={{ padding: '8px 12px' }}>Timestamp</th>
                          <th style={{ padding: '8px 12px' }}>Event Type</th>
                          <th style={{ padding: '8px 12px' }}>Resource</th>
                          <th style={{ padding: '8px 12px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {explanation.related_events.map((rev) => (
                          <tr key={rev.id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#06b6d4' }}>#{rev.id}</td>
                            <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{rev.timestamp || 'N/A'}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: '#f8fafc' }}>{rev.event_type}</td>
                            <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>{rev.resource}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{ padding: '1px 6px', borderRadius: '4px', backgroundColor: rev.status_code >= 400 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: rev.status_code >= 400 ? '#fca5a5' : '#34d399', fontWeight: 700 }}>
                                {rev.status_code}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recommended Defensive Action */}
              <div
                style={{
                  backgroundColor: 'rgba(14, 165, 233, 0.1)',
                  border: '1.5px solid rgba(14, 165, 233, 0.35)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem', marginBottom: '6px' }}>
                  <ShieldAlert size={16} />
                  <span>Recommended Defensive SOC Action</span>
                </div>
                <div style={{ fontSize: '0.88rem', color: '#e0f2fe', lineHeight: 1.5 }}>
                  {explanation.recommended_action}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Deterministic Local Rule & Telemetry Synthesis (No External LLM API)
          </span>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
}
