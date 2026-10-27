import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';
import AccessDenied from '../pages/AccessDenied';

/**
 * Route wrapper requiring valid authentication.
 * If not authenticated, redirects to /login and saves attempted location.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState message="Authenticating University SOC security clearance..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

/**
 * Route wrapper requiring specific RBAC roles or permissions.
 * If user lacks required role/permission, renders professional 403 Access Denied.
 */
export function RoleRoute({ children, allowedRoles = [], requiredPermission = null }) {
  const { hasRole, hasPermission, loading } = useAuth();

  if (loading) {
    return <LoadingState message="Verifying role permissions and clearance level..." />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <AccessDenied requiredRoles={allowedRoles} />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDenied requiredPermission={requiredPermission} />;
  }

  return children;
}

export default ProtectedRoute;
