import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import SeverityBadge from '../components/SeverityBadge';
import EventModal from '../components/EventModal';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [severity, setSeverity] = useState('');
  const [username, setUsername] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [statusCode, setStatusCode] = useState('');

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simForm, setSimForm] = useState({
    username: '',
    ip_address: '',
    resource: '',
    event_type: 'LOGIN_FAILED',
    status_code: '401',
    message: '',
  });
  const [simLoading, setSimLoading] = useState(false);
  const [simMessage, setSimMessage] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getEvents({
        page,
        limit,
        search,
        event_type: eventType,
        severity,
        username,
        ip_address: ipAddress,
        status_code: statusCode,
      });
      setEvents(res.events || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError(err.message || 'Unable to connect to Security SOC backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, eventType, severity, statusCode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleSimulateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSimLoading(true);
      setSimMessage(null);
      const res = await api.syncLogs([
        {
          ...simForm,
          status_code: parseInt(simForm.status_code, 10),
          timestamp: new Date().toISOString(),
        },
      ]);
      setSimMessage(`Log preprocessed! New findings: ${res.new_findings_detected}, Anomaly: ${res.ml_anomalies_detected}`);
      setShowSimulateModal(false);
      fetchEvents();
    } catch (err) {
      setSimMessage(`Error: ${err.message}`);
    } finally {
      setSimLoading(false);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      headerStyle: { width: '60px' },
      render: (val) => <span className="font-mono" style={{ color: '#64748b', fontSize: '0.78rem' }}>#{val}</span>,
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (val) => (
        <span className="font-mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
          {val ? new Date(val).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' }) : '—'}
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
      render: (val) => <span className="font-mono" style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{val}</span>,
    },
    {
      key: 'event_type',
      label: 'Event Type',
      render: (val) => <span style={{ color: '#f8fafc', fontWeight: 500, fontSize: '0.8rem' }}>{val}</span>,
    },
    {
      key: 'status_code',
      label: 'Status Code',
      render: (val) => (
        <span
          className="font-mono"
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 700,
            backgroundColor: val >= 400 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: val >= 400 ? '#f87171' : '#34d399',
            border: `1px solid ${val >= 400 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
          }}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'resource',
      label: 'Target Resource',
      render: (val) => (
        <span className="font-mono" style={{ color: '#fbbf24', fontSize: '0.8rem' }}>
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

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Page Header */}
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
              <Sparkles size={11} /> LIVE STREAM
            </span>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Showing {events.length} of {total} total records
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
            Security Events Stream
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Raw logs validated, normalized, and stored by the University Log Preprocessing Engine
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowSimulateModal(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.82rem' }}
          >
            <PlusCircle size={15} />
            <span>Simulate Log Ingestion</span>
          </button>

          <button
            onClick={fetchEvents}
            className="btn btn-secondary"
            title="Refresh logs"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {simMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#38bdf8',
            fontSize: '0.85rem',
          }}
        >
          {simMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search
              size={15}
              color="#64748b"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search user, IP, resource, message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '8px 18px' }}>
            <Search size={15} /> Filter
          </button>

          {(search || eventType || severity || statusCode) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setEventType('');
                setSeverity('');
                setStatusCode('');
                setPage(1);
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          )}
        </form>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b' }}>
            <Filter size={13} /> Filter By:
          </div>

          <select
            value={eventType}
            onChange={(e) => { setEventType(e.target.value); setPage(1); }}
            className="input-field"
            style={{ fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <option value="">All Event Types</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="UNAUTHORIZED_ACCESS">UNAUTHORIZED_ACCESS</option>
            <option value="RESOURCE_ACCESS">RESOURCE_ACCESS</option>
            <option value="ADMIN_ACCESS">ADMIN_ACCESS</option>
            <option value="LOGOUT">LOGOUT</option>
          </select>

          <select
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
            className="input-field"
            style={{ fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <option value="">All Severities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusCode}
            onChange={(e) => { setStatusCode(e.target.value); setPage(1); }}
            className="input-field"
            style={{ fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <option value="">All Status Codes</option>
            <option value="200">200 OK</option>
            <option value="201">201 Created</option>
            <option value="401">401 Unauthorized</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
            <option value="500">500 Server Error</option>
          </select>
        </div>
      </div>

      {/* Main Events Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        {loading ? (
          <LoadingState message="Fetching normalized security events..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchEvents} />
        ) : (
          <DataTable
            columns={columns}
            data={events}
            onRowClick={(ev) => setSelectedEvent(ev)}
            emptyMessage={search || eventType || severity || statusCode ? "No security events match the current filter parameters." : "No security events available."}
            pagination={{
              page,
              totalPages,
              onPageChange: (newPage) => setPage(newPage),
            }}
          />
        )}
      </div>

      {/* Detailed Modal on Event Click */}
      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      {/* Ingestion Simulator Modal */}
      {showSimulateModal && (
        <div className="modal-overlay" onClick={() => setShowSimulateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#f8fafc' }}>
                Simulate University Log Event Ingestion
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Test the log validation, normalization, and automatic rule triggering pipeline.
              </p>
            </div>

            <form onSubmit={handleSimulateSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Target Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. student_test"
                  value={simForm.username}
                  onChange={(e) => setSimForm({ ...simForm, username: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Source IP Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 192.168.1.100"
                  value={simForm.ip_address}
                  onChange={(e) => setSimForm({ ...simForm, ip_address: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                    Event Type
                  </label>
                  <select
                    value={simForm.event_type}
                    onChange={(e) => setSimForm({ ...simForm, event_type: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                    <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                    <option value="UNAUTHORIZED_ACCESS">UNAUTHORIZED_ACCESS</option>
                    <option value="RESOURCE_ACCESS">RESOURCE_ACCESS</option>
                    <option value="ADMIN_ACCESS">ADMIN_ACCESS</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                    HTTP Status Code
                  </label>
                  <input
                    type="number"
                    required
                    value={simForm.status_code}
                    onChange={(e) => setSimForm({ ...simForm, status_code: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Target Resource Path
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. /portal/grades"
                  value={simForm.resource}
                  onChange={(e) => setSimForm({ ...simForm, resource: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Log Message / Details
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Failed password validation"
                  value={simForm.message}
                  onChange={(e) => setSimForm({ ...simForm, message: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simLoading}
                  className="btn btn-primary"
                >
                  {simLoading ? 'Processing...' : 'Submit to Ingestion Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
