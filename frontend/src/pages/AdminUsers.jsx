import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Modal State for Changing Role
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('VIEWER');
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminUsers({
        role: roleFilter,
        status: statusFilter,
        search,
      });
      setUsers(res.users || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch administrator user list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleRoleChangeSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setUpdating(true);
      setActionError(null);
      const res = await api.updateUserRole(editingUser.id, selectedRole);
      setActionMessage(res.message);
      setEditingUser(null);
      fetchUsers();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setActionError(err.message || 'Failed to update user role.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'Active' ? 'Disabled' : 'Active';
    try {
      setActionError(null);
      const res = await api.updateUserStatus(user.id, newStatus);
      setActionMessage(res.message);
      fetchUsers();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setActionError(err.message || 'Failed to update user status.');
      setTimeout(() => setActionError(null), 5000);
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#f87171',
        };
      case 'SECURITY_ANALYST':
        return {
          background: 'rgba(168, 85, 247, 0.15)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          color: '#c084fc',
        };
      case 'VIEWER':
      default:
        return {
          background: 'rgba(6, 182, 212, 0.15)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          color: '#38bdf8',
        };
    }
  };

  const columns = [
    {
      key: 'full_name',
      label: 'Full Name',
      render: (val, row) => (
        <div>
          <strong style={{ color: '#f8fafc', display: 'block' }}>{val || 'Unnamed User'}</strong>
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>ID #{row.id}</span>
        </div>
      ),
    },
    {
      key: 'username',
      label: 'Username',
      render: (val) => <span className="font-mono" style={{ color: '#38bdf8', fontWeight: 600 }}>{val}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (val) => <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{val || '—'}</span>,
    },
    {
      key: 'department',
      label: 'Department',
      render: (val) => <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{val || 'General'}</span>,
    },
    {
      key: 'role',
      label: 'Role',
      render: (val) => (
        <span
          style={{
            padding: '3px 9px',
            borderRadius: '12px',
            fontSize: '0.74rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'inline-block',
            ...getRoleBadgeStyle(val),
          }}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: val === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: val === 'Active' ? '#34d399' : '#f87171',
            border: `1px solid ${val === 'Active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'last_login',
      label: 'Last Login',
      render: (val) => (
        <span className="font-mono" style={{ fontSize: '0.76rem', color: '#64748b' }}>
          {val ? new Date(val).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Change Role Button */}
          <button
            onClick={() => {
              setEditingUser(row);
              setSelectedRole(row.role);
              setActionError(null);
            }}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.74rem' }}
            title="Change User Role"
          >
            <Edit2 size={13} />
            <span>Role</span>
          </button>

          {/* Toggle Activate / Deactivate Button */}
          <button
            onClick={() => handleToggleStatus(row)}
            className="btn btn-secondary"
            style={{
              padding: '4px 8px',
              fontSize: '0.74rem',
              color: row.status === 'Active' ? '#f87171' : '#34d399',
            }}
            title={row.status === 'Active' ? 'Deactivate account' : 'Activate account'}
          >
            {row.status === 'Active' ? <UserX size={13} /> : <UserCheck size={13} />}
            <span>{row.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
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
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Shield size={11} /> ADMIN CLEARANCE ONLY
            </span>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {users.length} Total Registered Users
            </span>
          </div>

          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
            SOC User & Access Control Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Administer user authorization, promote or demote role tiers, and control active status
          </p>
        </div>

        <button onClick={fetchUsers} className="btn btn-secondary">
          <RefreshCw size={15} />
          <span>Refresh Users</span>
        </button>
      </div>

      {/* Action Notifications */}
      {actionMessage && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search
            size={14}
            color="#64748b"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search by name, username, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ width: '100%', paddingLeft: '34px', fontSize: '0.82rem' }}
          />
        </form>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field"
          style={{ fontSize: '0.8rem' }}
        >
          <option value="">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SECURITY_ANALYST">SECURITY_ANALYST</option>
          <option value="VIEWER">VIEWER</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field"
          style={{ fontSize: '0.8rem' }}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Disabled">Disabled</option>
        </select>

        {(search || roleFilter || statusFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setRoleFilter('');
              setStatusFilter('');
            }}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Users Data Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        {loading ? (
          <LoadingState message="Loading SOC user directory and access permissions..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchUsers} />
        ) : (
          <DataTable
            columns={columns}
            data={users}
            emptyMessage="No users found matching current filter parameters."
          />
        )}
      </div>

      {/* Change Role Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={16} color="#06b6d4" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                  Modify Role for {editingUser.username}
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRoleChangeSubmit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Select New Clearance Role:
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  <option value="VIEWER">VIEWER (Read-Only SOC)</option>
                  <option value="SECURITY_ANALYST">SECURITY_ANALYST (Active Scanning & Analysis)</option>
                  <option value="ADMIN">ADMIN (Full Access & User Management)</option>
                </select>
              </div>

              {actionError && (
                <div style={{ fontSize: '0.78rem', color: '#f87171' }}>
                  {actionError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn btn-primary"
                >
                  {updating ? 'Updating...' : 'Save Role Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
