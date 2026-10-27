import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import api from '../services/api';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function Vulnerabilities() {
  const [vulns, setVulns] = useState([]);
  const [summary, setSummary] = useState({ total: 0, passed: 0, warning: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scanMessage, setScanMessage] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchVulnerabilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getVulnerabilities();
      setVulns(res.vulnerabilities || []);
      setSummary(res.summary || { total: 0, passed: 0, warning: 0, failed: 0 });
    } catch (err) {
      console.error('Failed to fetch vulnerabilities:', err);
      setError(err.message || 'Unable to connect to Security SOC backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVulnerabilities();
  }, []);

  const handleRunScan = async () => {
    try {
      setScanning(true);
      setScanMessage('Scanning target headers and security configurations...');
      const res = await api.runVulnerabilityScan();
      setVulns(res.vulnerabilities || []);
      setSummary(res.summary || { total: 0, passed: 0, warning: 0, failed: 0 });
      setScanMessage(`Audit scan completed! ${res.vulnerabilities?.length || 0} configuration controls evaluated.`);
      setTimeout(() => setScanMessage(null), 4000);
    } catch (err) {
      setScanMessage(`Scan error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div
        className="glass-card"
        style={{
          padding: '22px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge-demo" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
              <Sparkles size={11} /> AUDIT ENGINE
            </span>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Safe Non-Destructive Configuration Audit
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
            Security Configuration Audit
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Safe, non-destructive evaluation of campus web application headers, transport encryption, and session cookies
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={scanning}
          className="btn btn-primary"
        >
          <ShieldCheck size={16} className={scanning ? 'animate-spin' : ''} />
          <span>{scanning ? 'Scanning Target...' : 'Run Vulnerability Scan'}</span>
        </button>
      </div>

      {scanMessage && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            backgroundColor: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#38bdf8',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Summary Posture Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="glass-card glow-card" style={{ padding: '16px 20px', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Checks
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
            {summary.total}
          </div>
        </div>

        <div className="glass-card glow-card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.74rem', color: '#86efac', textTransform: 'uppercase', fontWeight: 600 }}>
            Passed Checks
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            {summary.passed} Passed
          </div>
        </div>

        <div className="glass-card glow-card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.74rem', color: '#fcd34d', textTransform: 'uppercase', fontWeight: 600 }}>
            Warning Checks
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
            {summary.warning} Warnings
          </div>
        </div>

        <div className="glass-card glow-card" style={{ padding: '16px 20px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.74rem', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 600 }}>
            Failed Checks
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>
            {summary.failed} Failed
          </div>
        </div>
      </div>

      {/* Audit Checklist Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        {loading || scanning ? (
          <LoadingState message={scanning ? 'Evaluating HTTP security headers and policy flags...' : 'Loading vulnerability posture...'} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchVulnerabilities} />
        ) : vulns.length === 0 ? (
          <EmptyState
            title="No Vulnerability Checks"
            message="No configuration audit results available."
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Check Name</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Target Host</th>
                  <th>Audit Evidence</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {vulns.map((v) => {
                  const isExp = expandedId === v.id;
                  return (
                    <React.Fragment key={v.id}>
                      <tr
                        onClick={() => setExpandedId(isExp ? null : v.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{v.name}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{v.description}</div>
                        </td>
                        <td style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{v.category}</td>
                        <td><SeverityBadge severity={v.severity} /></td>
                        <td><StatusBadge status={v.status} /></td>
                        <td className="font-mono" style={{ color: '#38bdf8', fontSize: '0.76rem' }}>
                          {v.target}
                        </td>
                        <td style={{ color: '#94a3b8', fontSize: '0.78rem', maxWidth: '300px' }}>
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {v.evidence}
                          </span>
                        </td>
                        <td>
                          {isExp ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                        </td>
                      </tr>

                      {isExp && (
                        <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                          <td colSpan={7} style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div>
                                <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                                  Full Evidence Details:
                                </span>
                                <div
                                  className="font-mono"
                                  style={{
                                    backgroundColor: '#090d16',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    color: '#cbd5e1',
                                    marginTop: '4px',
                                  }}
                                >
                                  {v.evidence}
                                </div>
                              </div>

                              <div>
                                <span style={{ fontSize: '0.74rem', color: '#06b6d4', textTransform: 'uppercase', fontWeight: 600 }}>
                                  Defensive Hardening Recommendation:
                                </span>
                                <div
                                  style={{
                                    backgroundColor: 'rgba(6, 182, 212, 0.08)',
                                    border: '1px solid rgba(6, 182, 212, 0.2)',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.82rem',
                                    color: '#e2e8f0',
                                    marginTop: '4px',
                                  }}
                                >
                                  {v.recommendation}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
