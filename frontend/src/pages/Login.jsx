import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  KeyRound,
  X,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, sessionExpiredNotice, clearNotice } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Forgot Password Academic Prototype Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotMessage, setForgotMessage] = useState(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showResetFields, setShowResetFields] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Where to redirect after login (default /dashboard)
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setError('Please provide both username/email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(usernameOrEmail.trim(), password, rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      if (err.status === 401) {
        setError('Invalid username or password.');
      } else if (err.status === 403) {
        setError(err.message || 'Account disabled. Contact your administrator.');
      } else if (!err.status) {
        setError('Security SOC API server unavailable. Ensure backend is running.');
      } else {
        setError(err.message || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    try {
      setForgotLoading(true);
      setForgotMessage(null);
      const res = await api.forgotPassword(forgotInput.trim());
      setForgotMessage(res.message);
      if (res.prototype_available) {
        setShowResetFields(true);
      }
    } catch (err) {
      setForgotMessage('If the account exists, password reset instructions would be provided.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    try {
      setForgotLoading(true);
      const res = await api.resetPassword(forgotInput.trim(), newPassword);
      setResetSuccess(true);
      setForgotMessage(res.message || 'Password updated successfully. You can now log in.');
      setTimeout(() => {
        setShowForgotModal(false);
        setShowResetFields(false);
        setResetSuccess(false);
        setPassword(newPassword);
        setUsernameOrEmail(forgotInput);
      }, 2500);
    } catch (err) {
      setForgotMessage(err.message || 'Password reset failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  const fillDemoCredentials = (u, p) => {
    setUsernameOrEmail(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#070b14',
        backgroundImage: `
          radial-gradient(circle at 50% 20%, rgba(6, 182, 212, 0.12), transparent 45%),
          radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.08), transparent 40%),
          radial-gradient(circle at 20% 90%, rgba(139, 92, 246, 0.07), transparent 40%)
        `,
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative cyber grid lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Main Glass Card */}
      <div
        className="glass-card glow-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '38px 36px',
          borderRadius: '16px',
          background: 'rgba(11, 18, 33, 0.88)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px -10px rgba(6, 182, 212, 0.15)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: '#06b6d4',
              boxShadow: '0 0 25px rgba(6, 182, 212, 0.3)',
            }}
          >
            <ShieldCheck size={28} />
          </div>

          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#f8fafc',
              letterSpacing: '-0.02em',
              marginBottom: '4px',
            }}
          >
            University Security SOC
          </h1>

          <div
            style={{
              fontSize: '0.86rem',
              color: '#38bdf8',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            Secure Access Portal
          </div>

          <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
            AI-Based Log Pre-Processing & Threat Detection Platform
          </p>
        </div>

        {/* Session Expired Alert */}
        {sessionExpiredNotice && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#fbbf24',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{sessionExpiredNotice}</span>
            <button
              onClick={clearNotice}
              style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: '6px',
              }}
            >
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                color="#64748b"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="e.g. admin or admin@university.local"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '38px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                }}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => { setShowForgotModal(true); setForgotInput(usernameOrEmail); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 500,
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="#64748b"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px', fontSize: '0.85rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem',
                color: '#94a3b8',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#06b6d4', cursor: 'pointer' }}
              />
              Remember Me (24h token)
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '11px',
              fontSize: '0.9rem',
              fontWeight: 700,
              justifyContent: 'center',
              marginTop: '4px',
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '22px 0 16px',
            color: '#475569',
            fontSize: '0.74rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
          <span>Or Create New Access</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
        </div>

        {/* Register Navigation Button */}
        <Link
          to="/register"
          className="btn btn-secondary"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
            justifyContent: 'center',
            textAlign: 'center',
            textDecoration: 'none',
          }}
        >
          <span>Create Security SOC Account</span>
        </Link>

        {/* Demo Credentials Quick-Select Helper */}
        <div
          style={{
            marginTop: '22px',
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.76rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
            <KeyRound size={13} color="#06b6d4" />
            <span>Academic Prototype Demo Logins:</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button
              type="button"
              onClick={() => fillDemoCredentials('admin', 'Admin@123')}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '5px 8px', justifyContent: 'center' }}
              title="Full SOC Administration & User Management"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('analyst', 'Analyst@123')}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '5px 8px', justifyContent: 'center' }}
              title="Threat Analysis & Scan Execution"
            >
              Analyst
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('viewer', 'Viewer@123')}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '5px 8px', justifyContent: 'center' }}
              title="Read-Only SOC Telemetry Monitoring"
            >
              Viewer
            </button>
          </div>
        </div>

        {/* Environment Disclaimer */}
        <div
          style={{
            marginTop: '16px',
            textAlign: 'center',
            fontSize: '0.72rem',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
          <span>Demo environment — authorized users only</span>
        </div>
      </div>

      {/* Forgot Password Academic Prototype Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
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
                <KeyRound size={18} color="#06b6d4" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                  Reset Password
                </h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '22px' }}>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '14px' }}>
                Enter your account username or registered email address. In this local academic prototype, password updates can be completed directly.
              </p>

              {forgotMessage && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    backgroundColor: resetSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                    border: `1px solid ${resetSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`,
                    color: resetSuccess ? '#34d399' : '#38bdf8',
                    fontSize: '0.78rem',
                    marginBottom: '14px',
                  }}
                >
                  {forgotMessage}
                </div>
              )}

              {!showResetFields ? (
                <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '5px' }}>
                      Account Username or Email
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. analyst"
                      value={forgotInput}
                      onChange={(e) => setForgotInput(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', fontSize: '0.84rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="btn btn-primary"
                    >
                      {forgotLoading ? 'Verifying...' : 'Request Reset'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '5px' }}>
                      New Password (Min 8 chars, 1 upper, 1 lower, 1 digit)
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="e.g. NewSecret@123"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', fontSize: '0.84rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="btn btn-primary"
                    >
                      {forgotLoading ? 'Updating...' : 'Set New Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
