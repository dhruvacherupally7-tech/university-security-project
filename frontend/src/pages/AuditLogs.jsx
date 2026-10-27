import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  Clock,
  User,
  Network,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lock,
  Layers
} from 'lucide-react';
import api from '../services/api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [distinctActions, setDistinctActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [username, setUsername] = useState('');

  const fetchLogs = async (targetPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAuditLogs({
        page: targetPage,
        limit: 20,
        search,
        action,
        username,
      });
      setLogs(res.audit_logs || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
      setPage(res.page || 1);
      if (res.distinct_actions && res.distinct_actions.length > 0) {
        setDistinctActions(res.distinct_actions);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Unable to retrieve audit log records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [action, username]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const getActionBadge = (actionStr = '') => {
    const act = actionStr.toUpperCase();
    if (act.includes('FAIL')) {
      return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.35)', text: '#fca5a5' };
    }
    if (act === 'LOGIN') {
      return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.35)', text: '#34d399' };
    }
    if (act === 'ROLE_CHANGED' || act === 'STATUS_CHANGED') {
      return { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.35)', text: '#c084fc' };
    }
    if (act.includes('AUDIT') || act.includes('SCAN') || act.includes('ML')) {
      return { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.35)', text: '#38bdf8' };
    }
    return { bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)', text: '#cbd5e1' };
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
            <span
              className="badge-demo"
              style={{
                background: 'rgba(168, 85, 247, 0.15)',
                borderColor: 'rgba(168, 85, 247, 0.35)',
                color: '#c084fc',
              }}
            >
              <Lock size={11} /> ADMIN AUDIT TRAIL
            </span>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Immutable Compliance & Security Access Log ({total} Entries)
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
            Security System Audit Logs
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Complete audit record of user logins, role modifications, threat evaluations, and reporting activity
          </p>
        </div>

        <button onClick={() => fetchLogs(page)} className="btn btn-secondary">
          <RefreshCw size={15} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        className="glass-card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search
            size={15}
            color="#64748b"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search action, description, IP, resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '34px', width: '100%', fontSize: '0.82rem' }}
          />
        </form>

        {/* Action Dropdown */}
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="input-field"
          style={{ fontSize: '0.82rem', minWidth: '180px' }}
        >
          <option value="">All Security Actions</option>
          {distinctActions.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>

        {/* Username Filter */}
        <input
          type="text"
          placeholder="Filter by operator username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-field"
          style={{ fontSize: '0.82rem', width: '200px' }}
        />

        {(search || action || username) && (
          <button
            onClick={() => {
              setSearch('');
              setAction('');
              setUsername('');
              fetchLogs(1);
            }}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 0' }}>
            <LoadingState message="Querying security audit logs from SQLite database..." />
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px' }}>
            <ErrorState message={error} onRetry={() => fetchLogs(page)} />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px 20px' }}>
            <EmptyState
              title="No Audit Records Found"
              message={search || action || username ? "No audit log events match the applied filter criteria." : "No audit trail events recorded."}
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '12px 18px' }}>Timestamp</th>
                  <th style={{ padding: '12px 18px' }}>Operator</th>
                  <th style={{ padding: '12px 18px' }}>Action</th>
                  <th style={{ padding: '12px 18px' }}>Resource Target</th>
                  <th style={{ padding: '12px 18px' }}>Client IP</th>
                  <th style={{ padding: '12px 18px' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const badgeStyle = getActionBadge(log.action);
                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Timestamp */}
                      <td style={{ padding: '12px 18px', color: '#94a3b8', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={13} color="#06b6d4" />
                          <span>{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</span>
                        </div>
                      </td>

                      {/* Username */}
                      <td style={{ padding: '12px 18px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} color="#94a3b8" />
                          <span>{log.username || 'system'}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '12px 18px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: badgeStyle.bg,
                            border: `1px solid ${badgeStyle.border}`,
                            color: badgeStyle.text,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Resource */}
                      <td style={{ padding: '12px 18px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                        {log.resource_type ? (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                            {log.resource_type}{log.resource_id ? ` #${log.resource_id}` : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b' }}>—</span>
                        )}
                      </td>

                      {/* IP Address */}
                      <td style={{ padding: '12px 18px', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                        {log.ip_address || '127.0.0.1'}
                      </td>

                      {/* Description */}
                      <td style={{ padding: '12px 18px', color: '#e2e8f0', lineHeight: 1.4 }}>
                        {log.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total logs)
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
