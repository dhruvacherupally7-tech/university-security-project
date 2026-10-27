import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AccessDenied from './pages/AccessDenied';

// SOC Dashboard Pages
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Findings from './pages/Findings';
import Users from './pages/Users';
import IPs from './pages/IPs';
import Vulnerabilities from './pages/Vulnerabilities';
import MLAnomaly from './pages/MLAnomaly';
import Health from './pages/Health';
import Reports from './pages/Reports';
import AdminUsers from './pages/AdminUsers';
import AuditLogs from './pages/AuditLogs';

function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleGlobalSearch = (query) => {
    if (query) {
      navigate(`/events?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 45,
          }}
        />
      )}

      {/* Persistent Left Sidebar */}
      <Sidebar isMobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} />

      {/* Main Workspace Area */}
      <div className="main-content">
        <TopBar
          toggleMobile={() => setMobileOpen(!mobileOpen)}
          onGlobalSearch={handleGlobalSearch}
        />

        <main style={{ flex: 1, paddingBottom: '32px' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/findings" element={<Findings />} />
            <Route path="/users" element={<Users />} />
            <Route path="/ips" element={<IPs />} />
            <Route path="/vulnerabilities" element={<Vulnerabilities />} />
            <Route path="/ml" element={<MLAnomaly />} />
            <Route path="/health" element={<Health />} />
            <Route path="/reports" element={<Reports />} />

            {/* Admin Exclusive User Management */}
            <Route
              path="/admin/users"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminUsers />
                </RoleRoute>
              }
            />

            {/* Admin Audit Trail */}
            <Route
              path="/admin/audit-logs"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AuditLogs />
                </RoleRoute>
              }
            />

            <Route path="/403" element={<AccessDenied />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/403" element={<AccessDenied />} />

          {/* Protected SOC Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
