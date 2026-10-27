const API_BASE_URL = 'http://localhost:5000/api';

// Token Management
let authToken = localStorage.getItem('univ_soc_token') || sessionStorage.getItem('univ_soc_token') || null;

export function getStoredToken() {
  return authToken;
}

export function setAuthToken(token, rememberMe = true) {
  authToken = token;
  if (token) {
    if (rememberMe) {
      localStorage.setItem('univ_soc_token', token);
      sessionStorage.removeItem('univ_soc_token');
    } else {
      sessionStorage.setItem('univ_soc_token', token);
      localStorage.removeItem('univ_soc_token');
    }
  } else {
    localStorage.removeItem('univ_soc_token');
    sessionStorage.removeItem('univ_soc_token');
  }
}

export function clearAuthToken() {
  setAuthToken(null);
}

/**
 * Universal fetch wrapper with Authorization Bearer header injection and 401 handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.message || errorBody.error || `HTTP ${response.status}: ${response.statusText}`;

      // Notify AuthContext on 401 (Session Expired / Unauthorized)
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { message: errorMessage } }));
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = errorBody;
      throw error;
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
}

// ==========================================
// AUTHENTICATION APIs
// ==========================================
export async function login(usernameOrEmail, password, rememberMe = true) {
  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
  });
  if (res.access_token) {
    setAuthToken(res.access_token, rememberMe);
  }
  return res;
}

export async function register(userData) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (e) {
    console.warn('Logout notification error:', e);
  } finally {
    clearAuthToken();
  }
}

export async function getCurrentUser() {
  return apiRequest('/auth/me');
}

export async function forgotPassword(usernameOrEmail) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ username_or_email: usernameOrEmail }),
  });
}

export async function resetPassword(usernameOrEmail, newPassword) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      username_or_email: usernameOrEmail,
      new_password: newPassword,
    }),
  });
}

export async function getPermissions() {
  return apiRequest('/auth/permissions');
}

// ==========================================
// ADMIN USER MANAGEMENT APIs
// ==========================================
export async function getAdminUsers(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiRequest(`/admin/users${queryString}`);
}

export async function updateUserRole(userId, role) {
  return apiRequest(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function updateUserStatus(userId, status) {
  return apiRequest(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ==========================================
// EXISTING SOC MODULE APIs
// ==========================================

// 1. Dashboard API
export async function getDashboardSummary() {
  return apiRequest('/dashboard/summary');
}

// 2. Events API
export async function getEvents(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiRequest(`/events${queryString}`);
}

export async function getEvent(id) {
  return apiRequest(`/events/${id}`);
}

export async function syncLogs(logs) {
  return apiRequest('/logs/sync', {
    method: 'POST',
    body: JSON.stringify({ logs }),
  });
}

// 3. Findings API
export async function getFindings(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiRequest(`/findings${queryString}`);
}

export async function getFinding(id) {
  return apiRequest(`/findings/${id}`);
}

// 4. Users Telemetry API
export async function getUsers() {
  return apiRequest('/users');
}

export async function getUser(username) {
  return apiRequest(`/users/${encodeURIComponent(username)}`);
}

// 5. IPs API
export async function getIPs() {
  return apiRequest('/ips');
}

export async function getIP(ip) {
  return apiRequest(`/ips/${encodeURIComponent(ip)}`);
}

// 6. Vulnerabilities API
export async function getVulnerabilities() {
  return apiRequest('/vulnerabilities');
}

export async function runVulnerabilityScan(target = null) {
  return apiRequest('/vulnerability/scan', {
    method: 'POST',
    body: JSON.stringify({ target }),
  });
}

// 7. ML Anomaly API
export async function getMLSummary() {
  return apiRequest('/ml/summary');
}

export async function getMLAnomalies() {
  return apiRequest('/ml/anomalies');
}

export async function runMLAnalysis() {
  return apiRequest('/ml/run', {
    method: 'POST',
  });
}

// 8. Health & System Health API
export async function getHealth() {
  return apiRequest('/health');
}

export async function getSystemHealth() {
  return apiRequest('/system-health');
}

// 9. Reports API
export async function getReports() {
  return apiRequest('/reports');
}

export async function generateReport(reportType = 'Comprehensive SOC Audit') {
  return apiRequest('/reports/generate', {
    method: 'POST',
    body: JSON.stringify({ report_type: reportType }),
  });
}

export async function getFindingExplanation(findingId) {
  return apiRequest(`/findings/${findingId}/explanation`);
}

export async function updateFindingStatus(findingId, status) {
  return apiRequest(`/findings/${findingId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// 10. Audit Logs API (Admin & Analyst)
export async function getAuditLogs(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiRequest(`/audit-logs${queryString}`);
}

// 11. Security PDF Download
export async function downloadSecurityPdf() {
  const url = `${API_BASE_URL}/reports/security-pdf`;
  const headers = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.error || `HTTP ${response.status}: Failed to generate PDF`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  link.download = `University_SOC_Security_Report_${timestamp}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return true;
}

export default {
  // Auth & Admin
  getStoredToken,
  setAuthToken,
  clearAuthToken,
  login,
  register,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  getPermissions,
  getAdminUsers,
  updateUserRole,
  updateUserStatus,
  // Existing SOC
  getDashboardSummary,
  getEvents,
  getEvent,
  syncLogs,
  getFindings,
  getFinding,
  getFindingExplanation,
  updateFindingStatus,
  getUsers,
  getUser,
  getIPs,
  getIP,
  getVulnerabilities,
  runVulnerabilityScan,
  getMLSummary,
  getMLAnomalies,
  runMLAnalysis,
  getHealth,
  getSystemHealth,
  getReports,
  generateReport,
  downloadSecurityPdf,
  getAuditLogs,
};
