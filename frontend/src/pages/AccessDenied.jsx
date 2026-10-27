import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, AlertTriangle, ArrowLeft, Home, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AccessDenied({ requiredRoles = [], requiredPermission = null }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: '20px',
      }}
    >
      <div
        className="glass-card glow-card"
        style={{
          maxWidth: '540px',
          width: '100%',
          padding: '36px 32px',
          textAlign: 'center',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(24, 15, 28, 0.85))',
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#f87171',
          }}
        >
          <ShieldX size={36} />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            HTTP 403 Forbidden
          </span>
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
          Security Clearance Required
        </h1>

        <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '22px' }}>
          Your current account role does not have authorization to view or execute operations in this module.
        </p>

        {/* User Role & Required Info */}
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '26px',
            textAlign: 'left',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Authenticated User:</span>
            <strong style={{ color: '#f8fafc' }}>{user?.username} ({user?.full_name || 'N/A'})</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Assigned Role:</span>
            <span
              style={{
                fontWeight: 700,
                color: user?.role === 'ADMIN' ? '#f87171' : user?.role === 'SECURITY_ANALYST' ? '#a855f7' : '#38bdf8',
              }}
            >
              {user?.role || 'VIEWER'}
            </span>
          </div>
          {requiredRoles.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Authorized Roles:</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>{requiredRoles.join(' or ')}</span>
            </div>
          )}
          {requiredPermission && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Required Permission:</span>
              <span className="font-mono" style={{ color: '#fbbf24' }}>{requiredPermission}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            style={{ padding: '9px 18px' }}
          >
            <ArrowLeft size={15} />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
            style={{ padding: '9px 18px' }}
          >
            <Home size={15} />
            <span>SOC Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
