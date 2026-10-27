import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Building,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    department: 'Computer Science',
    role: 'VIEWER',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Compute password criteria
  const hasMinLength = form.password.length >= 8;
  const hasUpper = /[A-Z]/.test(form.password);
  const hasLower = /[a-z]/.test(form.password);
  const hasNumber = /\d/.test(form.password);
  const passwordsMatch = form.password && form.password === form.confirm_password;

  const score = [hasMinLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;
  const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Strong'];
  const strengthColors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (!form.full_name.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!form.username.trim() || form.username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (score < 4) {
      setError('Password does not meet the complexity requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    try {
      setLoading(true);
      await register({
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        department: form.department,
        role: form.role,
      });

      setSuccessMessage('Account created successfully.');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.message || 'Account registration failed.');
    } finally {
      setLoading(false);
    }
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
        padding: '30px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="glass-card glow-card"
        style={{
          maxWidth: '540px',
          width: '100%',
          padding: '36px 34px',
          borderRadius: '16px',
          background: 'rgba(11, 18, 33, 0.88)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px -10px rgba(6, 182, 212, 0.15)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: '#06b6d4',
            }}
          >
            <ShieldCheck size={26} />
          </div>

          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
            Create Security SOC Account
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Register access credentials for university log defense and monitoring
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={18} />
            <span>{successMessage} Redirecting to login...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Row 1: Full Name & Username */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '32px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Username *
              </label>
              <div style={{ position: 'relative' }}>
                <UserCheck size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. jdoe_soc"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '32px', fontSize: '0.82rem' }}
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
              Campus Email Address *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                required
                placeholder="e.g. jdoe@university.local"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                style={{ width: '100%', paddingLeft: '32px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          {/* Row 2: Department & Role */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Department
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '32px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Initial SOC Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input-field"
                style={{ width: '100%', fontSize: '0.82rem' }}
              >
                <option value="VIEWER">VIEWER (Read-Only)</option>
                <option value="SECURITY_ANALYST">SECURITY_ANALYST (Active)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Password & Confirm */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '32px', paddingRight: '32px', fontSize: '0.82rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Confirm Password *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="Confirm"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '32px', paddingRight: '32px', fontSize: '0.82rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {form.password && (
            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', padding: '10px 12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Password Strength:</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: strengthColors[Math.max(0, score - 1)] }}>
                  {score > 0 ? strengthLabels[score - 1] : 'Incomplete'}
                </span>
              </div>

              {/* Strength Meter Bar */}
              <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '8px' }}>
                {[0, 1, 2, 3].map((step) => (
                  <div
                    key={step}
                    style={{
                      flex: 1,
                      borderRadius: '2px',
                      backgroundColor: step < score ? strengthColors[score - 1] : 'rgba(255, 255, 255, 0.1)',
                      transition: 'background-color 0.2s ease',
                    }}
                  />
                ))}
              </div>

              {/* Requirement Checklist */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.7rem' }}>
                <span style={{ color: hasMinLength ? '#34d399' : '#64748b' }}>
                  {hasMinLength ? '✓' : '○'} Min 8 characters
                </span>
                <span style={{ color: hasUpper ? '#34d399' : '#64748b' }}>
                  {hasUpper ? '✓' : '○'} 1 Uppercase letter
                </span>
                <span style={{ color: hasLower ? '#34d399' : '#64748b' }}>
                  {hasLower ? '✓' : '○'} 1 Lowercase letter
                </span>
                <span style={{ color: hasNumber ? '#34d399' : '#64748b' }}>
                  {hasNumber ? '✓' : '○'} 1 Numeric digit
                </span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '0.88rem',
                fontWeight: 700,
                justifyContent: 'center',
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <Link
              to="/login"
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '0.82rem',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
