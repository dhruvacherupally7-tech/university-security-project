import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Users,
  Network,
  Activity,
  Cpu,
  ShieldCheck,
  FileText,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import api from '../services/api';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import RiskScoreBadge from '../components/RiskScoreBadge';
import DataTable from '../components/DataTable';
import EventModal from '../components/EventModal';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentFindings, setRecentFindings] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Real-time Refresh states (Feature 5)
  const [refreshInterval, setRefreshInterval] = useState(10); // 10s default
  const [countdown, setCountdown] = useState(10);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      setIsRefreshing(true);
      const [sumData, evData, findData] = await Promise.all([
        api.getDashboardSummary(),
        api.getEvents({ limit: 8 }),
        api.getFindings(),
      ]);
      setSummary(sumData);
      setRecentEvents(evData.events || []);
      setRecentFindings((findData.findings || []).slice(0, 5));
      const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLastUpdated(nowStr);
      setIsOffline(false);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setIsOffline(true);
      if (!silent && !summary) {
        setError(err.message || 'Unable to connect to Security SOC backend.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false);
  }, []);

  // Periodic Refresh timer
  useEffect(() => {
    if (refreshInterval === 0) return; // Manual mode

    setCountdown(refreshInterval);
    const intervalTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchDashboardData(true);
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalTimer);
  }, [refreshInterval]);

  const handleRunScan = async () => {
    try {
      setActionLoading(true);
      setActionMessage('Initiating Safe Vulnerability Configuration Audit...');
      await api.runVulnerabilityScan();
      setActionMessage('Vulnerability scan completed successfully!');
      await fetchDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      setActionMessage(`Scan failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunML = async () => {
    try {
      setActionLoading(true);
      setActionMessage('Running Isolation Forest Anomaly Detection...');
      const res = await api.runMLAnalysis();
      setActionMessage(`ML Complete: Identified ${res.potential_anomalies || 0} potential anomalies.`);
      await fetchDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      setActionMessage(`ML run failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setActionLoading(true);
      setActionMessage('Generating comprehensive SOC audit report...');
      const rep = await api.generateReport('Dashboard Quick Assessment');
      setActionMessage(`Audit report created: "${rep.report_name}"`);
      await fetchDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      setActionMessage(`Report generation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !summary) {
    return <LoadingState message="Loading SOC dashboard metrics and live telemetry..." />;
  }

  if (error && !summary) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  // Chart Colors
  const PIE_COLORS = ['#06b6d4', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  const eventColumns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (val) => (
        <span className="font-mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
          {val ? new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
        </span>
      ),
    },
    {
      key: 'username',
      label: 'User',
      render: (val) => <span style={{ fontWeight: 600, color: '#38bdf8' }}>{val}</span>,
    },
    {
      key: 'ip_address',
      label: 'Source IP',
      render: (val) => <span className="font-mono" style={{ color: '#cbd5e1' }}>{val}</span>,
    },
    {
      key: 'event_type',
      label: 'Event Type',
      render: (val) => (
        <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 500 }}>{val}</span>
      ),
    },
    {
      key: 'status_code',
      label: 'Status',
      render: (val) => (
        <span
          className="font-mono"
          style={{
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 700,
            backgroundColor: val >= 400 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: val >= 400 ? '#f87171' : '#34d399',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'resource',
      label: 'Resource',
      render: (val) => (
        <span className="font-mono" style={{ color: '#fbbf24', fontSize: '0.78rem' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (val) => <SeverityBadge severity={val} />,
    },
  ];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Top Banner / Header */}
      <div
        className="glass-card glow-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(13, 21, 39, 0.85))',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge-demo" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
              <Sparkles size={12} /> LIVE SOC
            </span>

            {/* Live Monitoring Indicator (Feature 5) */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: '16px',
                backgroundColor: isOffline ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${isOffline ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: isOffline ? '#ef4444' : '#10b981',
                  boxShadow: isOffline ? '0 0 8px #ef4444' : '0 0 8px #10b981',
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: isOffline ? '#f87171' : '#34d399',
                  letterSpacing: '0.04em',
                }}
              >
                {isOffline ? 'BACKEND OFFLINE' : '● LIVE'}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {isOffline
                  ? `Last successful update: ${lastUpdated || 'None'}`
                  : `Last updated: ${lastUpdated || 'Just now'}${refreshInterval > 0 ? ` • Next in ${countdown}s` : ' • Manual'}`}
              </span>
            </div>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Welcome to University Security SOC
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
            AI-Based Log Pre-Processing, Threat Detection & Vulnerability Scanning
          </p>
        </div>

        {/* Quick Action Buttons & Refresh Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Refresh Interval Selector (Feature 5) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Refresh:</span>
            <select
              value={refreshInterval}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRefreshInterval(val);
                setCountdown(val);
              }}
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                cursor: 'pointer',
              }}
            >
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
              <option value={0}>Manual</option>
            </select>
          </div>

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Manual Refresh"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleRunScan}
            disabled={actionLoading}
            className="btn btn-secondary"
            title="Safe and non-destructive header & policy audit"
          >
            <ShieldCheck size={16} color="#06b6d4" />
            <span>Run Vulnerability Scan</span>
          </button>

          <button
            onClick={handleRunML}
            disabled={actionLoading}
            className="btn btn-secondary"
            title="Execute Isolation Forest clustering on entity feature vectors"
          >
            <Cpu size={16} color="#a855f7" />
            <span>Run ML Analysis</span>
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={actionLoading}
            className="btn btn-primary"
          >
            <FileText size={16} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            backgroundColor: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#38bdf8',
            fontSize: '0.85rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Activity size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Primary KPI Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '18px',
        }}
      >
        <StatCard
          title="Overall Risk Score"
          value={
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span>{summary?.overall_risk_score ?? 0}</span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>/ 100</span>
            </div>
          }
          subtitle={`Threat Posture: ${summary?.overall_risk_level || 'LOW'}`}
          icon={ShieldAlert}
          color={
            (summary?.overall_risk_score || 0) >= 80 ? 'red' :
            (summary?.overall_risk_score || 0) >= 60 ? 'orange' :
            (summary?.overall_risk_score || 0) >= 30 ? 'amber' : 'green'
          }
          onClick={() => navigate('/findings')}
        />
        <StatCard
          title="Total Events"
          value={summary?.total_events}
          subtitle="Pre-processed log entries"
          icon={Activity}
          color="cyan"
          onClick={() => navigate('/events')}
        />
        <StatCard
          title="Security Findings"
          value={summary?.total_findings}
          subtitle="Correlated defensive alerts"
          icon={AlertTriangle}
          color="red"
          onClick={() => navigate('/findings')}
        />
        <StatCard
          title="Active Users"
          value={summary?.active_users}
          subtitle="Monitored university accounts"
          icon={Users}
          color="blue"
          onClick={() => navigate('/users')}
        />
        <StatCard
          title="Monitored IPs"
          value={summary?.monitored_ips}
          subtitle="Campus subnets & endpoints"
          icon={Network}
          color="purple"
          onClick={() => navigate('/ips')}
        />
      </div>

      {/* Threat Posture & Vulnerability Posture Strips */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '18px',
        }}
      >
        {/* Risk Score Assessment Gauge Card (Feature 2) */}
        <div
          className="glass-card"
          style={{
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              University Risk Score
            </span>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Dynamic Assessment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
            <RiskScoreBadge score={summary?.overall_risk_score} level={summary?.overall_risk_level} size="lg" />
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', textAlign: 'center', marginTop: '6px' }}>
            Dynamic threat metric computed across authentication anomalies & ML outliers
          </div>
        </div>
        {/* Severity Summary Card */}
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Threat Findings Severity
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Current Baseline</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>
                {summary?.high_severity ?? 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#fca5a5', fontWeight: 600, textTransform: 'uppercase' }}>
                High
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>
                {summary?.medium_severity ?? 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#fcd34d', fontWeight: 600, textTransform: 'uppercase' }}>
                Medium
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
                {summary?.low_severity ?? 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#86efac', fontWeight: 600, textTransform: 'uppercase' }}>
                Low
              </div>
            </div>
          </div>
        </div>

        {/* Vulnerability Posture Card */}
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Vulnerability Posture ({(summary?.passed_vulnerabilities ?? 0) + (summary?.warning_vulnerabilities ?? 0) + (summary?.failed_vulnerabilities ?? 0)} Checks)
            </span>
            <span
              onClick={() => navigate('/vulnerabilities')}
              style={{ fontSize: '0.78rem', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Details <ArrowRight size={12} />
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
                {summary?.passed_vulnerabilities ?? 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#86efac', fontWeight: 600, textTransform: 'uppercase' }}>
                Passed
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>
                {summary?.warning_vulnerabilities ?? 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#fcd34d', fontWeight: 600, textTransform: 'uppercase' }}>
                Warning
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>
                {summary?.failed_vulnerabilities ?? 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#fca5a5', fontWeight: 600, textTransform: 'uppercase' }}>
                Failed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Timeline Chart */}
        <ChartCard
          title="Security Activity Overview"
          subtitle="Event ingestion distribution across chronological hourly timeline"
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={summary?.events_by_time || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                }}
              />
              <Area type="monotone" dataKey="events" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#eventGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Event Type Donut Chart */}
        <ChartCard
          title="Event Type Distribution"
          subtitle="Proportion of authenticated, failed, and unauthorized actions"
        >
          <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '16px' }}>
            <ResponsiveContainer width="60%" height={260}>
              <PieChart>
                <Pie
                  data={summary?.events_by_type || []}
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(summary?.events_by_type || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.8rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
              {(summary?.events_by_type || []).map((entry, idx) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ color: '#cbd5e1' }}>{entry.name}</span>
                  </div>
                  <strong style={{ color: '#f8fafc' }}>{entry.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Top Active Users */}
        <ChartCard
          title="Top Active Users"
          subtitle="Accounts generating highest log transaction counts"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={summary?.top_users || []} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="username" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Monitored IPs */}
        <ChartCard
          title="Top Monitored IPs"
          subtitle="Workstations & subnets with highest request throughput"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={summary?.top_ips || []} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
              <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="ip" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Findings Table Preview */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Correlated Threat Findings
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Identified security threats detected by rule engine and anomalous patterns
            </p>
          </div>
          <button
            onClick={() => navigate('/findings')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <span>View All Findings ({summary?.total_findings})</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Finding</th>
                <th>Risk Score</th>
                <th>Severity</th>
                <th>Category</th>
                <th>User</th>
                <th>IP Address</th>
                <th>Status</th>
                <th>Detection</th>
              </tr>
            </thead>
            <tbody>
              {recentFindings.map((f) => (
                <tr key={f.id} onClick={() => navigate('/findings')}>
                  <td style={{ fontWeight: 600, color: '#f8fafc' }}>{f.title}</td>
                  <td><RiskScoreBadge score={f.risk_score} level={f.risk_level} size="sm" showLevel={false} /></td>
                  <td><SeverityBadge severity={f.severity} /></td>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{f.category}</td>
                  <td style={{ color: '#38bdf8', fontWeight: 500 }}>{f.username || 'System'}</td>
                  <td className="font-mono" style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{f.ip_address}</td>
                  <td><StatusBadge status={f.status} /></td>
                  <td style={{ color: '#a855f7', fontSize: '0.78rem' }}>{f.detection_method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Latest Security Events Table Preview */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Latest Security Events Stream
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Real-time normalized university application and authentication audit trail
            </p>
          </div>
          <button
            onClick={() => navigate('/events')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <span>All Events ({summary?.total_events})</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <DataTable
          columns={eventColumns}
          data={recentEvents}
          onRowClick={(ev) => setSelectedEvent(ev)}
          emptyMessage="No security events available."
        />
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
