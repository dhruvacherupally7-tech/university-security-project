import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  Printer,
  Calendar,
} from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import SeverityBadge from '../components/SeverityBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfFeedback, setPdfFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReports();
      setReports(data || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError(err.message || 'Unable to connect to Security SOC backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGeneratePdf = async () => {
    try {
      setDownloadingPdf(true);
      setPdfFeedback(null);
      await api.downloadSecurityPdf();
      setPdfFeedback({
        type: 'success',
        message: 'Security Assessment Report (PDF) compiled and downloaded successfully.',
      });
      setTimeout(() => {
        setPdfFeedback(null);
      }, 5000);
      fetchReports();
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setPdfFeedback({
        type: 'error',
        message: `Failed to compile PDF report: ${err.message || 'Backend error'}`,
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const newReport = await api.generateReport('University Security Assessment Report');
      setActiveReport(newReport);
      setReportModalOpen(true);
      fetchReports();
    } catch (err) {
      alert(`Report generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (report) => {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(report.report_name || 'soc_report').replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const columns = [
    {
      key: 'report_name',
      label: 'Report Name',
      render: (val) => (
        <div>
          <strong style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} color="#06b6d4" /> {val}
          </strong>
        </div>
      ),
    },
    {
      key: 'report_type',
      label: 'Type',
      render: (val) => <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{val}</span>,
    },
    {
      key: 'total_events',
      label: 'Events',
      render: (val) => <span className="font-mono">{val}</span>,
    },
    {
      key: 'total_findings',
      label: 'Findings',
      render: (val) => <strong className="font-mono" style={{ color: '#f8fafc' }}>{val}</strong>,
    },
    {
      key: 'high_severity',
      label: 'High',
      render: (val) => <span className="font-mono" style={{ color: '#f87171', fontWeight: 700 }}>{val}</span>,
    },
    {
      key: 'medium_severity',
      label: 'Medium',
      render: (val) => <span className="font-mono" style={{ color: '#fbbf24', fontWeight: 700 }}>{val}</span>,
    },
    {
      key: 'low_severity',
      label: 'Low',
      render: (val) => <span className="font-mono" style={{ color: '#34d399', fontWeight: 700 }}>{val}</span>,
    },
    {
      key: 'generated_at',
      label: 'Generated At',
      render: (val) => (
        <span className="font-mono" style={{ fontSize: '0.78rem', color: '#64748b' }}>
          {val ? new Date(val).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(row);
            }}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.74rem' }}
            title="Download JSON"
          >
            <Download size={13} />
          </button>
        </div>
      ),
    },
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
            <span className="badge-demo" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
              <Sparkles size={11} /> AUDIT ARCHIVE
            </span>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Compliant SOC Audit History
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
            Security Audit Reports
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Generate executive cybersecurity audit summaries compiling logs, threat findings, and hardening recommendations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleGeneratePdf}
            disabled={downloadingPdf || generating}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Download size={16} className={downloadingPdf ? 'animate-spin' : ''} />
            <span>{downloadingPdf ? 'Generating PDF...' : 'Generate Security Report'}</span>
            <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', fontWeight: 700 }}>
              PDF
            </span>
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={generating || downloadingPdf}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Compile JSON audit summary modal"
          >
            <FileText size={14} className={generating ? 'animate-spin' : ''} />
            <span>{generating ? 'Compiling...' : 'Quick JSON'}</span>
          </button>
        </div>
      </div>

      {/* PDF Notification Alert */}
      {pdfFeedback && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            background: pdfFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${pdfFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
            color: pdfFeedback.type === 'success' ? '#34d399' : '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {pdfFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
            <span>{pdfFeedback.message}</span>
          </div>
          <button
            onClick={() => setPdfFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Reports Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
          Report Audit History
        </h3>

        {loading ? (
          <LoadingState message="Loading historical security audit logs..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchReports} />
        ) : (
          <DataTable
            columns={columns}
            data={reports}
            emptyMessage="No reports generated yet."
          />
        )}
      </div>

      {/* View Generated Report Modal */}
      {reportModalOpen && activeReport && (
        <div className="modal-overlay" onClick={() => setReportModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '850px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  {activeReport.report_name}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#06b6d4' }}>
                  {activeReport.project_title}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleDownload(activeReport)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                >
                  <Download size={14} /> Download JSON
                </button>
                <button
                  onClick={() => setReportModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Report Content */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '0.85rem' }}>
              {/* Executive Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Total Events</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
                    {activeReport.executive_summary?.total_events}
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Total Findings</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f87171' }}>
                    {activeReport.executive_summary?.total_findings}
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Vulnerability Posture</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>
                    {activeReport.executive_summary?.vulnerability_posture?.passed} Passed / {activeReport.executive_summary?.vulnerability_posture?.warning} Warning
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ML Potential Anomalies</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#a855f7' }}>
                    {activeReport.executive_summary?.ml_anomaly_posture?.potential_anomalies}
                  </div>
                </div>
              </div>

              {/* Threat Findings */}
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                  Correlated Threat Findings ({activeReport.threat_findings?.length || 0})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(activeReport.threat_findings || []).map((f) => (
                    <div
                      key={f.id}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <strong style={{ color: '#f8fafc' }}>{f.title}</strong>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{f.description}</div>
                      </div>
                      <SeverityBadge severity={f.severity} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                  Defensive Hardening Recommendations
                </h4>
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', color: '#cbd5e1' }}>
                  {(activeReport.security_recommendations || []).map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setReportModalOpen(false)} className="btn btn-secondary">
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
