/**
 * Centralized API client for BankOfCaptcha.
 * All backend requests go through this module so that:
 *  - Base URL is defined in one place
 *  - Auth token is attached automatically
 *  - Error handling is consistent
 */

const API_BASE = 'http://localhost:8080';

/**
 * Build standard headers, optionally including the JWT token.
 */
const getHeaders = (token, isJson = true) => {
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/**
 * Generic fetch wrapper.
 * Returns parsed JSON on success, throws on network/HTTP errors.
 */
const request = async (method, path, { token, body, parseJson = true } = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: getHeaders(token, !!body),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (parseJson) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  }

  // For endpoints that return plain text
  const text = await res.text();
  if (!res.ok) throw { status: res.status, message: text };
  return text;
};

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────
export const login = (username, password) =>
  request('POST', '/api/auth/login', { body: { username, password } });

export const register = (data) =>
  request('POST', '/api/auth/register', { body: data });

// ──────────────────────────────────────────────
// Accounts
// ──────────────────────────────────────────────
export const fetchAccounts = (token) =>
  request('GET', '/api/accounts', { token });

// ──────────────────────────────────────────────
// Transactions
// ──────────────────────────────────────────────
export const submitTransfer = (token, { sourceAccountNumber, destAccountNumber, amount }) =>
  request('POST', '/api/transactions/transfer', {
    token,
    body: { sourceAccountNumber, destAccountNumber, amount },
    parseJson: false,
  });

export const fetchTransactionRequests = (token) =>
  request('GET', '/api/transactions/requests', { token });

export const approveTransaction = (token, id) =>
  request('POST', `/api/transactions/requests/${id}/approve`, { token, parseJson: false });

export const rejectTransaction = (token, id) =>
  request('POST', `/api/transactions/requests/${id}/reject`, { token, parseJson: false });

// ──────────────────────────────────────────────
// KYC
// ──────────────────────────────────────────────
export const fetchKycQueue = (token) =>
  request('GET', '/api/kyc/queue', { token });

export const approveKyc = (token, id) =>
  request('POST', `/api/kyc/${id}/approve`, { token });

// ──────────────────────────────────────────────
// Audit Logs
// ──────────────────────────────────────────────
export const fetchAuditLogs = (token) =>
  request('GET', '/api/audit/logs', { token });

export const verifyLogIntegrity = (token, id) =>
  request('GET', `/api/audit/logs/${id}/verify`, { token });

// ──────────────────────────────────────────────
// AI Alerts
// ──────────────────────────────────────────────
export const fetchAiAlerts = (token) =>
  request('GET', '/api/ai/alerts', { token });

export const resolveAlert = (token, id) =>
  request('POST', `/api/admin/alerts/${id}/release`, { token });

export const resolveAllAlerts = (token) =>
  request('POST', '/api/admin/alerts/resolve-all', { token });

export const fetchUserActivity = (token, username) =>
  request('GET', `/api/admin/users/${username}/activity`, { token });

// ──────────────────────────────────────────────
// Branches
// ──────────────────────────────────────────────
export const fetchBranches = (token) =>
  request('GET', '/api/branches', { token });

export const fetchBranchesPublic = () =>
  request('GET', '/api/branches');

export const createBranch = (token, data) =>
  request('POST', '/api/branches', { token, body: data });

export const assignStaffToBranch = (token, branchId, userId) =>
  request('POST', `/api/branches/${branchId}/assign/${userId}`, { token });

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────
export const fetchUsers = (token) =>
  request('GET', '/api/branches/users', { token });

// ──────────────────────────────────────────────
// Staff Management
// ──────────────────────────────────────────────
export const createStaff = (token, data) =>
  request('POST', '/api/admin/staff', { token, body: data });

// ──────────────────────────────────────────────
// AI Training (IT Admin)
// ──────────────────────────────────────────────
export const fetchAiTrainingMetrics = (token) =>
  request('GET', '/api/ai/training/metrics', { token });

export const triggerAdaptiveTraining = (token) =>
  request('POST', '/api/ai/training/trigger', { token });

export const updateAlertFeedback = (token, id, isFalsePositive) =>
  request('PUT', `/api/ai/alerts/${id}/feedback`, { token, body: { isFalsePositive } });
