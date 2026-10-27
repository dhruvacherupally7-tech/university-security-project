import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  UserCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Sparkles,
  X,
  Clock,
  Shield,
  Activity,
} from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [userDetail, setUserDetail] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Unable to connect to Security SOC backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    try {
      setModalLoading(true);
      const detail = await api.getUser(user.username);
      setUserDetail(detail);
    } catch (err) {
      console.error('Failed to fetch user details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(s) ||
      u.full_name.toLowerCase().includes(s) ||
      u.department.toLowerCase().includes(s) ||
      u.role.toLowerCase().includes(s)
    );
  });

  const columns = [
    {
      key: 'username',
      label: 'Username',
      render: (val) => <strong style={{ color: '#38bdf8' }}>{val}</strong>,
    },
    {
      key: 'full_name',
      label: 'Full Name',
      render: (val) => <span style={{ color: '#f8fafc', fontWeight: 500 }}>{val}</span>,
    },
    {
      key: 'role',
      label: 'Role',
      render: (val) => <span style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>{val}</span>,
    },
    {
      key: 'department',
      label: 'Department',
      render: (val) => <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{val}</span>,
    },
    {
      key: 'event_count',
      label: 'Total Events',
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
      key: 'failed_logins',
      label: 'Failed Logins',
      render: (val) => (
        <span
          className="font-mono"
          style={{
            fontWeight: 700,
            color: val > 0 ? '#f87171' : '#64748b',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'successful_logins',
      label: 'Success Logins',
      render: (val) => (
        <span className="font-mono" style={{ color: '#34d399', fontWeight: 600 }}>
          {val}
        </span>
      ),
    },
    {
      key: 'risk_level',
      label: 'Risk Level',
      render: (val) => <SeverityBadge severity={val} />,
    },
    {
      key: 'last_activity',
      label: 'Last Activity',
      render: (val) => (
        <span className="font-mono" style={{ fontSize: '0.76rem', color: '#64748b' }}>
          {val ? new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Inactive'}
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
              <Sparkles size={11} /> ACTIVE DIRECTORY
            </span>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {users.length} Active Campus Accounts Tracked
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
            User Account Monitoring
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Tracks authentication velocity, privilege usage, and individual user risk levels
          </p>
        </div>

        <button onClick={fetchUsers} className="btn btn-secondary">
          <RefreshCw size={15} />
          <span>Refresh Users</span>
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
            placeholder="Search by username, full name, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ width: '100%', paddingLeft: '36px', fontSize: '0.82rem' }}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        {loading ? (
          <LoadingState message="Fetching monitored user telemetry..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchUsers} />
        ) : (
          <DataTable
            columns={columns}
            data={filteredUsers}
            onRowClick={handleUserClick}
            emptyMessage={search ? "No users found matching your search." : "No user accounts recorded."}
          />
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => { setSelectedUser(null); setUserDetail(null); }}>
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
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                  }}
                >
                  <UsersIcon size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                    {selectedUser.full_name} ({selectedUser.username})
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    {selectedUser.role} • {selectedUser.department}
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setSelectedUser(null); setUserDetail(null); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                aria-label="Close user modal"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Risk Level</div>
                  <div style={{ marginTop: '4px' }}><SeverityBadge severity={selectedUser.risk_level} /></div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Events</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{selectedUser.event_count}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#fca5a5', textTransform: 'uppercase' }}>Failed Logins</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f87171', marginTop: '2px' }}>{selectedUser.failed_logins}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#86efac', textTransform: 'uppercase' }}>Success Logins</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>{selectedUser.successful_logins}</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                  Recent Activity Trail
                </h4>
                {modalLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading event trail...</div>
                ) : userDetail?.recent_events?.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {userDetail.recent_events.map((ev) => (
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
                          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{ev.event_type}</span> on{' '}
                          <span className="font-mono" style={{ color: '#fbbf24' }}>{ev.resource}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="font-mono" style={{ color: '#94a3b8' }}>HTTP {ev.status_code}</span>
                          <span className="font-mono" style={{ color: '#64748b' }}>
                            {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>No recent events recorded.</div>
                )}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setSelectedUser(null); setUserDetail(null); }} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
