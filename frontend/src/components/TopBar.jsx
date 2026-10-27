import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Shield, Menu, Clock, AlertCircle, LogOut, User, ChevronDown, Key, Building2, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TopBar({ toggleMobile, onGlobalSearch }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await api.getFindings();
        if (res && res.findings) {
          setNotifications(res.findings.slice(0, 5));
        }
      } catch (err) {
        // Silent fail for notification drop
      }
    };
    loadNotifications();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onGlobalSearch) {
      onGlobalSearch(searchVal);
    }
  };

  return (
    <header
      style={{
        height: '68px',
        backgroundColor: '#0a0f1d',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={toggleMobile}
          className="mobile-toggle-btn"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px',
            display: 'none',
          }}
          aria-label="Toggle Navigation"
        >
          <Menu size={22} />
        </button>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '280px' }}>
          <Search
            size={16}
            color="#64748b"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search events, IPs, findings..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="input-field"
            style={{
              paddingLeft: '38px',
              width: '100%',
              fontSize: '0.82rem',
              height: '38px',
            }}
          />
        </form>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Live Clock */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#94a3b8',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <Clock size={14} color="#06b6d4" />
          <span>{currentTime || 'Syncing...'}</span>
        </div>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '8px',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 6px #ef4444',
                }}
              />
            )}
          </button>

          {showNotifications && (
            <div
              className="glass-card"
              style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '320px',
                padding: '16px',
                zIndex: 100,
                backgroundColor: '#0f172a',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '10px', color: '#f8fafc' }}>
                Recent Threat Alerts ({notifications.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                {notifications.length === 0 ? (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '12px' }}>
                    No active threat alerts
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '8px 10px',
                        background: n.severity === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        borderLeft: `3px solid ${n.severity === 'High' ? '#ef4444' : '#f59e0b'}`,
                        borderRadius: '4px',
                        color: n.severity === 'High' ? '#fca5a5' : '#fcd34d',
                      }}
                    >
                      <strong>{n.severity}:</strong> {n.title}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Authenticated User Profile & Dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingLeft: '12px',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: user?.role === 'ADMIN'
                  ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                  : user?.role === 'SECURITY_ANALYST'
                  ? 'linear-gradient(135deg, #0284c7, #06b6d4)'
                  : 'linear-gradient(135deg, #059669, #10b981)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 0 12px rgba(0,0,0,0.4)',
              }}
            >
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <Shield size={18} />}
            </div>

            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.2 }}>
                  {user?.full_name || 'SOC Operator'}
                </span>
                <ChevronDown size={14} color="#94a3b8" style={{ transform: showProfileMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>

              {/* Role Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: user?.role === 'ADMIN'
                      ? 'rgba(168, 85, 247, 0.2)'
                      : user?.role === 'SECURITY_ANALYST'
                      ? 'rgba(6, 182, 212, 0.2)'
                      : 'rgba(16, 185, 129, 0.2)',
                    color: user?.role === 'ADMIN'
                      ? '#c084fc'
                      : user?.role === 'SECURITY_ANALYST'
                      ? '#38bdf8'
                      : '#34d399',
                    border: `1px solid ${
                      user?.role === 'ADMIN'
                        ? 'rgba(168, 85, 247, 0.4)'
                        : user?.role === 'SECURITY_ANALYST'
                        ? 'rgba(6, 182, 212, 0.4)'
                        : 'rgba(16, 185, 129, 0.4)'
                    }`,
                  }}
                >
                  {user?.role ? user.role.replace('_', ' ') : 'VIEWER'}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  @{user?.username || 'user'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div
              className="glass-card"
              style={{
                position: 'absolute',
                right: 0,
                top: '50px',
                width: '280px',
                padding: '16px',
                zIndex: 100,
                backgroundColor: '#0c1322',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
              }}
            >
              {/* User details summary */}
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
                  {user?.full_name}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                  {user?.email || 'operator@university.local'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.72rem', color: '#64748b' }}>
                  <Building2 size={13} color="#06b6d4" />
                  <span>{user?.department || 'Information Security'}</span>
                </div>
              </div>

              {/* Clearance / Permissions */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                  <span>SOC Clearance</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                    {user?.role === 'ADMIN' ? 'Tier 1 — Full SOC Admin' : user?.role === 'SECURITY_ANALYST' ? 'Tier 2 — Threat Analyst' : 'Tier 3 — Read-Only Viewer'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span>Account Status</span>
                  <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    Active
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/admin/users');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      background: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.25)',
                      color: '#e9d5ff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Key size={14} color="#c084fc" />
                    <span>Manage User Access</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#fca5a5',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <LogOut size={14} color="#ef4444" />
                  <span>Sign Out of SOC</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
