import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(api.getStoredToken());
  const [loading, setLoading] = useState(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(null);

  // Restore session from token on initial application load
  const restoreSession = useCallback(async () => {
    const existingToken = api.getStoredToken();
    if (!existingToken) {
      setUser(null);
      setTokenState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userData = await api.getCurrentUser();
      setUser(userData);
      setTokenState(existingToken);
    } catch (err) {
      console.warn('Stored token is invalid or expired:', err.message);
      api.clearAuthToken();
      setUser(null);
      setTokenState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    // Listen for unauthorized events triggered by 401 API responses
    const handleUnauthorized = (e) => {
      api.clearAuthToken();
      setUser(null);
      setTokenState(null);
      setSessionExpiredNotice('Your session has expired. Please sign in again.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [restoreSession]);

  /**
   * Log in user with credentials
   */
  const login = async (usernameOrEmail, password, rememberMe = true) => {
    const res = await api.login(usernameOrEmail, password, rememberMe);
    setUser(res.user);
    setTokenState(res.access_token);
    setSessionExpiredNotice(null);
    return res;
  };

  /**
   * Register a new account
   */
  const register = async (userData) => {
    return await api.register(userData);
  };

  /**
   * Log out current user
   */
  const logout = async () => {
    await api.logout();
    setUser(null);
    setTokenState(null);
    setSessionExpiredNotice(null);
  };

  /**
   * Checks if user has a specific role (or one of several roles if array passed)
   */
  const hasRole = (role) => {
    if (!user || !user.role) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  /**
   * Checks if user has a specific permission key
   */
  const hasPermission = (permission) => {
    if (!user) return false;
    // Admin has all permissions
    if (user.role === 'ADMIN') return true;
    const permissions = user.permissions || [];
    return permissions.includes(permission);
  };

  const clearNotice = () => setSessionExpiredNotice(null);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    loading,
    sessionExpiredNotice,
    clearNotice,
    login,
    logout,
    register,
    hasRole,
    hasPermission,
    restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
