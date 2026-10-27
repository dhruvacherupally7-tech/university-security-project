import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  AlertTriangle,
  Users,
  Network,
  ShieldCheck,
  Cpu,
  Activity,
  FileText,
  UserCog,
  ClipboardList,
  Radio,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isMobileOpen, closeMobile }) {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const isViewer = user?.role === 'VIEWER';

  const baseNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Security Events', path: '/events', icon: ShieldAlert },
    { name: 'Threat Findings', path: '/findings', icon: AlertTriangle },
    { name: 'User Monitoring', path: '/users', icon: Users },
    { name: 'IP Monitoring', path: '/ips', icon: Network },
    { name: 'Vulnerability Audit', path: '/vulnerabilities', icon: ShieldCheck },
    { name: 'ML Anomaly Engine', path: '/ml', icon: Cpu },
    { name: 'System Health', path: '/health', icon: Activity },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  const adminNavItems = [
    { name: 'User Management', path: '/admin/users', icon: UserCog, adminOnly: true },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: ClipboardList, adminOnly: true }
  ];

  return (
    <aside
      className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
      style={{
        width: '260px',
        backgroundColor: '#0a0f1d',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      <div>
        {/* Brand Header */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(14, 165, 233, 0.4)',
              color: '#ffffff',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              University SOC
            </div>
            <div style={{ fontSize: '0.72rem', color: '#06b6d4', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Security Center
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ padding: '4px 10px 8px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
            SOC Modules {isViewer && <span style={{ color: '#f59e0b', fontSize: '0.62rem', marginLeft: '6px' }}>(Read-Only)</span>}
          </div>

          {baseNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '9px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  backgroundColor: isActive ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                })}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.name}</span>
                {isViewer && (
                  <span style={{ fontSize: '0.62rem', color: '#64748b', padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)' }}>
                    RO
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Admin Exclusive Section */}
          {isAdmin && (
            <>
              <div style={{ padding: '16px 10px 8px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={11} /> Administration
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeMobile}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '9px',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#c084fc' : '#cbd5e1',
                      backgroundColor: isActive ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.05)',
                      border: isActive ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(168, 85, 247, 0.15)',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    })}
                  >
                    <Icon size={18} color="#c084fc" />
                    <span style={{ flex: 1 }}>{item.name}</span>
                    <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(168,85,247,0.2)', color: '#e9d5ff', fontWeight: 700 }}>
                      ADMIN
                    </span>
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>
      </div>

      {/* Footer System Status */}
      <div
        style={{
          padding: '18px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>
              System Online
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            v2.4
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
            backgroundColor: isViewer ? 'rgba(245, 158, 11, 0.1)' : 'rgba(6, 182, 212, 0.1)',
            border: `1px solid ${isViewer ? 'rgba(245, 158, 11, 0.3)' : 'rgba(6, 182, 212, 0.25)'}`,
            padding: '6px 10px',
            borderRadius: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={12} color={isViewer ? '#f59e0b' : '#10b981'} />
            <span style={{ fontSize: '0.72rem', color: isViewer ? '#fcd34d' : '#34d399', fontWeight: 600 }}>
              {user?.role ? user.role.replace('_', ' ') : 'RBAC Protected'}
            </span>
          </div>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
            {user?.department || 'SOC'}
          </span>
        </div>
      </div>
    </aside>
  );
}
