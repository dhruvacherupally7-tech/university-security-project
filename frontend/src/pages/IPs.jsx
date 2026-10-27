import React, { useState, useEffect } from 'react';
import {
  Network,
  Globe,
  Search,
  RefreshCw,
  Sparkles,
  X,
  Laptop,
  MapPin,
  Activity,
} from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import SeverityBadge from '../components/SeverityBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

export default function IPs() {
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedIP, setSelectedIP] = useState(null);
  const [ipDetail, setIpDetail] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchIPs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getIPs();
      setIps(data || []);
    } catch (err) {
      console.error('Failed to fetch IPs:', err);
      setError(err.message || 'Unable to connect to Security SOC backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIPs();
  }, []);

  const handleIPClick = async (ip) => {
    setSelectedIP(ip);
    try {
      setModalLoading(true);
      const detail = await api.getIP(ip.ip_address);
      setIpDetail(detail);
    } catch (err) {
      console.error('Failed to fetch IP details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredIPs = ips.filter((ip) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      ip.ip_address.toLowerCase().includes(s) ||
      ip.location.toLowerCase().includes(s) ||
      ip.device.toLowerCase().includes(s)
    );
  });

  const columns = [
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (val) => <strong className="font-mono" style={{ color: '#38bdf8' }}>{val}</strong>,
    },
    {
      key: 'location',
      label: 'Campus Location / Zone',
      render: (val) => (
        <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={13} color="#06b6d4" />
          {val}
        </span>
      ),
    },
    {
      key: 'device',
      label: 'Device Profile',
      render: (val) => (
        <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
          <Laptop size={13} color="#64748b" />
          {val}
        </span>
      ),
    },
    {
      key: 'event_count',
      label: 'Event Count',
      render: (val) => (
        <span
          className="font-mono"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '2px 8px',
            borderRadius: '4px',
            color: '#e2e8f0',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'user_count',
      label: 'Associated Users',
      render: (val) => <span className="font-mono" style={{ color: '#38bdf8' }}>{val}</span>,
    },
    {
      key: 'risk_level',
      label: 'Risk Level',
      render: (val) => <SeverityBadge severity={val} />,
    },
    {
      key: 'last_seen',
      label: 'Last Seen',
      render: (val) => (
        <span className="font-mono" style={{ fontSize: '0.76rem', color: '#64748b' }}>
          {val ? new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
        </span>
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
              <Sparkles size={11} /> SUBNET ACTIVE
            </span>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {ips.length} Key Subnet Workstations Monitored
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
            IP Address Monitoring
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Inspects internal network interfaces, Wi-Fi hot zones, and anomalous IP burst profiles
          </p>
        </div>

        <button onClick={fetchIPs} className="btn btn-secondary">
          <RefreshCw size={15} />
          <span>Refresh IPs</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <div style={{ position: 'relative', maxWidth: '380px' }}>
          <Search
            size={15}
            color="#64748b"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search IP, location, or device..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ width: '100%', paddingLeft: '36px', fontSize: '0.82rem' }}
          />
        </div>
      </div>

      {/* IPs Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        {loading ? (
          <LoadingState message="Fetching monitored IP address endpoints..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchIPs} />
        ) : (
          <DataTable
            columns={columns}
            data={filteredIPs}
            onRowClick={handleIPClick}
            emptyMessage={search ? "No IP addresses match your filter." : "No IP addresses recorded."}
          />
        )}
      </div>

      {/* IP Detail Modal */}
      {selectedIP && (
        <div className="modal-overlay" onClick={() => { setSelectedIP(null); setIpDetail(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#06b6d4',
                  }}
                >
                  <Network size={20} />
                </div>
                <div>
                  <h3 className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                    {selectedIP.ip_address}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    {selectedIP.location} • {selectedIP.device}
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setSelectedIP(null); setIpDetail(null); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                aria-label="Close IP modal"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Risk Level</div>
                  <div style={{ marginTop: '4px' }}><SeverityBadge severity={selectedIP.risk_level} /></div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Events</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{selectedIP.event_count}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>User Count</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>{selectedIP.user_count}</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                  Recent Associated Log Telemetry
                </h4>
                {modalLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading event records...</div>
                ) : ipDetail?.recent_events?.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {ipDetail.recent_events.map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                        }}
                      >
                        <div>
                          User <strong style={{ color: '#38bdf8' }}>{ev.username}</strong> requested{' '}
                          <span className="font-mono" style={{ color: '#fbbf24' }}>{ev.resource}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="font-mono" style={{ color: ev.status_code >= 400 ? '#f87171' : '#34d399' }}>
                            HTTP {ev.status_code}
                          </span>
                          <span className="font-mono" style={{ color: '#64748b' }}>
                            {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>No events recorded for this IP.</div>
                )}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setSelectedIP(null); setIpDetail(null); }} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
