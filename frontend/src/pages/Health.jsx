import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Terminal,
  Cpu,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

export default function Health() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSystemHealth();
      setServices(data || []);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
      setError(err.message || 'Unable to connect to Security SOC backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getServiceIcon = (name) => {
    switch (name) {
      case 'API Server':
        return Server;
      case 'Database':
        return Database;
      case 'Log Collector':
        return Terminal;
      case 'Preprocessor':
        return Activity;
      case 'Rule Engine':
        return ShieldCheck;
      case 'ML Engine':
        return Cpu;
      default:
        return Server;
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
              <Sparkles size={11} /> LIVE HEALTH
            </span>
            <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: services.every(s => s.status === 'Healthy' || s.status === 'Ready') ? '#10b981' : '#f59e0b' }} />
              {services.filter(s => s.status === 'Healthy' || s.status === 'Ready').length} of {services.length} Subsystems Healthy
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
            System Health & Pipeline Diagnostics
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Real-time status, latency, and operational telemetry across the {services.length} core SOC pipeline micro-services
          </p>
        </div>

        <button onClick={fetchHealth} className="btn btn-secondary">
          <RefreshCw size={15} />
          <span>Ping Diagnostics</span>
        </button>
      </div>

      {loading ? (
        <LoadingState message="Querying micro-service latency and pipeline health..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchHealth} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '18px',
          }}
        >
          {services.map((svc) => {
            const Icon = getServiceIcon(svc.service_name);
            return (
              <div
                key={svc.service_name}
                className="glass-card glow-card"
                style={{
                  padding: '22px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '190px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(6, 182, 212, 0.12)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#06b6d4',
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                          {svc.service_name}
                        </h3>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Core Architecture Service
                        </div>
                      </div>
                    </div>

                    <StatusBadge status={svc.status} />
                  </div>

                  <p style={{ fontSize: '0.83rem', color: '#94a3b8', lineHeight: 1.4, marginBottom: '14px' }}>
                    {svc.details}
                  </p>
                </div>

                <div
                  style={{
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.76rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b' }}>
                    <Clock size={12} />
                    <span>
                      {svc.checked_at ? new Date(svc.checked_at).toLocaleTimeString() : 'Recent'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: '#64748b' }}>Response: </span>
                    <strong className="font-mono" style={{ color: '#38bdf8' }}>
                      {svc.response_time} ms
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
