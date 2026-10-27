import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  TrendingDown,
  Layers,
  Clock,
  User,
  Globe,
} from 'lucide-react';
import api from '../services/api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function MLAnomaly() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [runMessage, setRunMessage] = useState(null);

  const fetchMLData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMLSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch ML summary:', err);
      setError(err.message || 'Unable to connect to Security SOC backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMLData();
  }, []);

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      setRunMessage('Extracting behavioral feature vectors and fitting Isolation Forest...');
      const res = await api.runMLAnalysis();
      setSummary({
        model_name: res.model_name || 'Isolation Forest',
        model_status: 'Ready',
        features: res.features_used || summary?.features || [],
        total_profiles: res.total_evaluated,
        anomaly_count: res.potential_anomalies,
        average_anomaly_score: res.average_anomaly_score,
        last_model_run: res.last_model_run,
        anomalies: res.results || [],
      });
      setRunMessage(`Analysis complete! Identified ${res.potential_anomalies} Potential Anomalies.`);
      setTimeout(() => setRunMessage(null), 4000);
    } catch (err) {
      setRunMessage(`ML run error: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const featureLabels = [
    { key: 'total_events', name: 'Total Events', desc: 'Aggregated transaction count in active window' },
    { key: 'failed_logins', name: 'Failed Logins', desc: 'Authentication failure frequency (401)' },
    { key: 'successful_logins', name: 'Successful Logins', desc: 'Valid login occurrences (200)' },
    { key: 'unauthorized_events', name: 'Unauthorized Events', desc: 'Forbidden resource access hits (403)' },
    { key: 'unique_resources', name: 'Unique Resources', desc: 'Scope of endpoints enumerated' },
    { key: 'failure_ratio', name: 'Failure Ratio', desc: 'Ratio of failed to total actions' },
    { key: 'hour_of_day', name: 'Hour of Day', desc: 'Diurnal timestamp distribution (0-23)' },
  ];

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
            <span className="badge-demo" style={{ background: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.3)', color: '#c084fc' }}>
              <Sparkles size={11} /> AI ENGINE
            </span>
            <span style={{ fontSize: '0.78rem', color: '#a855f7', fontWeight: 600 }}>
              Unsupervised Machine Learning Model
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
            AI Anomaly Detection Engine
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            scikit-learn Isolation Forest clustering flags statistical outliers as <em>Potential Anomalies</em> for analyst review
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={analyzing}
          className="btn btn-primary"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
        >
          <Cpu size={16} className={analyzing ? 'animate-spin' : ''} />
          <span>{analyzing ? 'Evaluating Clusters...' : 'Run ML Analysis'}</span>
        </button>
      </div>

      {runMessage && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#c084fc',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{runMessage}</span>
        </div>
      )}

      {/* Model Spec & State Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="glass-card" style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Active Algorithm
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginTop: '6px' }}>
            {summary?.model_name || 'Isolation Forest'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#a855f7', marginTop: '4px' }}>
            n_estimators=100 • contamination=auto
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Model Status
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
            {summary?.model_status || 'Ready'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
            In-memory sklearn pipeline
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Potential Anomalies
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24', marginTop: '6px' }}>
            {summary?.anomaly_count ?? 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
            Out of {summary?.total_profiles ?? 0} entity profiles
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Average Anomaly Score
          </div>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '6px' }}>
            {summary?.average_anomaly_score !== undefined && summary?.average_anomaly_score !== null ? summary.average_anomaly_score : '—'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
            Negative scores indicate outliers
          </div>
        </div>
      </div>

      {/* Feature Engineering Breakdown */}
      <div className="glass-card" style={{ padding: '22px 24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
          Behavioral Feature Extraction Vector (7 Features)
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
          The machine learning pipeline groups logs by (User, IP) and projects events into the following multi-dimensional feature space:
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px',
          }}
        >
          {featureLabels.map((f) => (
            <div
              key={f.key}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '12px 14px',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Layers size={13} color="#a855f7" />
                <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0' }}>
                  {f.name}
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Defensive Advisory Banner */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: '8px',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <Info size={18} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          <strong style={{ color: '#38bdf8' }}>SOC Defense Protocol:</strong> Machine Learning anomaly detection flags unusual statistical patterns classified as <em>"Potential Anomaly"</em>. In an authorized defensive security operation, an anomaly score does not automatically constitute a confirmed breach or attack; analyst correlation against ground truth is required.
        </div>
      </div>

      {/* Anomalies Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
          Entity Profile Clustering Results
        </h3>

        {loading || analyzing ? (
          <LoadingState message={analyzing ? 'Computing isolation trees on behavioral features...' : 'Loading anomaly scores...'} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchMLData} />
        ) : (!summary?.anomalies || summary.anomalies.length === 0) ? (
          <EmptyState
            title="No Anomaly Profiles"
            message="No entity profiles have been evaluated yet. Run ML Analysis to evaluate behavioral patterns."
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Entity Account</th>
                  <th>Origin IP</th>
                  <th>Anomaly Score</th>
                  <th>Classification</th>
                  <th>Feature Highlights</th>
                  <th>Evaluated At</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.anomalies || []).map((row, idx) => {
                  const isOutlier = row.is_anomaly;
                  const pf = row.parsed_features || {};
                  return (
                    <tr key={idx}>
                      <td>
                        <strong style={{ color: '#38bdf8' }}>{row.username}</strong>
                      </td>
                      <td className="font-mono" style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                        {row.ip_address}
                      </td>
                      <td>
                        <span
                          className="font-mono"
                          style={{
                            fontWeight: 700,
                            color: isOutlier ? '#f87171' : '#34d399',
                          }}
                        >
                          {row.anomaly_score}
                        </span>
                      </td>
                      <td>
                        {isOutlier ? (
                          <span className="badge badge-warning">
                            <AlertCircle size={12} /> Potential Anomaly
                          </span>
                        ) : (
                          <span className="badge badge-passed">
                            <CheckCircle2 size={12} /> Normal Baseline
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        <span className="font-mono">
                          ev={pf.total_events || 0} | fail={pf.failed_logins || 0} | unauth={pf.unauthorized_events || 0} | ratio={pf.failure_ratio || 0}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {row.created_at ? new Date(row.created_at).toLocaleTimeString() : 'Recent'}
                      </td>
                    </tr>
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
