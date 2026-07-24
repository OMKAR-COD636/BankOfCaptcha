import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Shield, Users, Building, FileText, AlertTriangle, Activity, X, Database, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import Navbar from '../../components/shared/Navbar';
import SecurityTab from '../../components/superadmin/SecurityTab';
import StaffManagementTab from '../../components/superadmin/StaffManagementTab';
import BranchOperationsTab from '../../components/superadmin/BranchOperationsTab';
import AuditLogTable from '../../components/shared/AuditLogTable';
import { useToast } from '../../components/shared/ToastContext';
import useAuth from '../../hooks/useAuth';
import * as api from '../../api/client';
import './SuperAdminDashboard.css';
import '../../components/shared/DashboardShell.css';

// ---------------------------------------------------------------------------
// Structured description renderer — ported from AlertReviewModal
// ---------------------------------------------------------------------------
const RISK_COLORS = {
  HIGH:    { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', accent: '#ef4444' },
  MEDIUM:  { bg: '#fffbeb', border: '#fcd34d', text: '#b45309', accent: '#f59e0b' },
  LOW:     { bg: '#f0fdf4', border: '#86efac', text: '#15803d', accent: '#22c55e' },
  UNKNOWN: { bg: '#f9fafb', border: '#e5e7eb', text: '#374151', accent: '#6b7280' },
};

const SIGNAL_META = {
  'S1': { label: 'S1 — Behavioral Sequence', icon: '🔍' },
  'S2': { label: 'S2 — Role Violation',       icon: '🚫' },
  'S3': { label: 'S3 — Transaction',           icon: '💸' },
  'S4': { label: 'S4 — Temporal Pattern',      icon: '🕐' },
};

const parseDescription = (description) => {
  if (!description) return null;
  const parts = description.split(' | ').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return null;

  const summaryLine = parts[0];
  let riskLevel = 'UNKNOWN';
  if (summaryLine.startsWith('HIGH')) riskLevel = 'HIGH';
  else if (summaryLine.startsWith('MEDIUM')) riskLevel = 'MEDIUM';
  else if (summaryLine.startsWith('LOW')) riskLevel = 'LOW';

  const scoreMatch = summaryLine.match(/(\d+)%/);
  const riskScore = scoreMatch ? parseInt(scoreMatch[1]) : null;

  const signals = parts.slice(1).map((part) => {
    const labelMatch = part.match(/^\[(S[1-4])\s*[–-]/);
    const signalKey = labelMatch ? labelMatch[1] : null;
    const meta = signalKey ? (SIGNAL_META[signalKey] || { label: signalKey, icon: '⚠️' }) : { label: 'Signal', icon: '⚠️' };
    const body = part.replace(/^\[.*?\]\s*/, '');
    return { ...meta, body };
  });

  return { riskLevel, riskScore, signals };
};

// ---------------------------------------------------------------------------
// Large Circular Risk Gauge — for the detail panel
// ---------------------------------------------------------------------------
const LargeRiskGauge = ({ value }) => {
  const size = 160;
  const strokeWidth = 12;
  const radius = 70;
  const circumference = Math.PI * radius; // 219.91
  const strokeDashoffset = circumference - (value / 100) * circumference;

  let color = '#22C55E';
  let glowColor = 'rgba(34, 197, 94, 0.3)';
  if (value >= 70) { color = '#EF4444'; glowColor = 'rgba(239, 68, 68, 0.3)'; }
  else if (value >= 50) { color = '#F59E0B'; glowColor = 'rgba(245, 158, 11, 0.3)'; }
  else if (value >= 30) { color = '#3B82F6'; glowColor = 'rgba(59, 130, 246, 0.3)'; }

  const riskLabel = value >= 70 ? 'HIGH' : value >= 50 ? 'MEDIUM' : 'LOW';

  return (
    <div className="sa-large-gauge half-gauge">
      <svg width={size} height={95} viewBox={`0 0 ${size} 95`}>
        <defs>
          <filter id="gaugeShadow">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={glowColor} />
          </filter>
          <linearGradient id={`gaugeGrad-${value}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path
          d="M 10 85 A 70 70 0 0 1 150 85"
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity="0.3"
        />
        {/* Foreground colored arc */}
        <path
          d="M 10 85 A 70 70 0 0 1 150 85"
          fill="none"
          stroke={`url(#gaugeGrad-${value})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter="url(#gaugeShadow)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="sa-gauge-center half-gauge-center">
        <span className="sa-gauge-value" style={{ color }}>{value}%</span>
        <span className="sa-gauge-label">{riskLabel} RISK</span>
      </div>
    </div>
  );
};

/**
 * Super Admin Dashboard — Sidebar-driven layout
 * 4 sections via sidebar nav:
 *   1. Security & Intelligence
 *   2. Staff Management
 *   3. Branch Operations
 *   4. Compliance & Audit
 */
const SuperAdminDashboard = () => {
  const { t } = useTranslation();
  const showToast = useToast();
  const { token, username } = useAuth();
  const [activeTab, setActiveTab] = useState('security');

  // Shared data across tabs
  const [logs, setLogs] = useState([]);
  const [aiAlerts, setAiAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [transactionRequests, setTransactionRequests] = useState([]);

  // Detail panel state — shows risk analysis when a user row is clicked
  const [selectedAlert, setSelectedAlert] = useState(null);

  // User activity data for the detail panel graphs
  const [activityData, setActivityData] = useState({ logs: [], transactions: [] });
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState(null);

  useEffect(() => {
    api.fetchAuditLogs(token).then(setLogs).catch(console.error);
    api.fetchAiAlerts(token).then(setAiAlerts).catch(console.error);
    api.fetchUsers(token).then(setUsers).catch(console.error);
    api.fetchBranches(token).then(setBranches).catch(console.error);
  }, [token]);

  // Fetch user activity when selectedAlert changes
  useEffect(() => {
    if (!selectedAlert) {
      setActivityData({ logs: [], transactions: [] });
      return;
    }

    setActivityLoading(true);
    setActivityError(null);
    api.fetchUserActivity(token, selectedAlert.flaggedUsername)
      .then(data => {
        setActivityData(data);
        setActivityLoading(false);
      })
      .catch(err => {
        console.error(err);
        setActivityError(err.message || 'Failed to fetch activity');
        setActivityLoading(false);
      });
  }, [selectedAlert?.id, token]);

  const openAlerts = aiAlerts.filter(a => a.status === 'OPEN');
  const highAlerts = aiAlerts.filter(a => a.severity === 'HIGH' && a.status === 'OPEN');

  const getUserRole = (uname) =>
    users.find(u => u.username === uname)?.role?.replace('ROLE_', '') || 'UNKNOWN';

  // Parse risk score from alert description
  const parseRiskScore = (description) => {
    if (!description) return null;
    const match = description.match(/(\d+)%/);
    return match ? parseInt(match[1]) : null;
  };

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
  };

  const handleResolveAlert = async () => {
    if (!selectedAlert) return;
    try {
      const data = await api.resolveAlert(token, selectedAlert.id);
      showToast(data.message || 'Alert resolved successfully', 'success');
      setAiAlerts(prev => prev.map(a => a.id === selectedAlert.id ? { ...a, status: 'RESOLVED' } : a));
      setSelectedAlert(prev => ({ ...prev, status: 'RESOLVED' }));
    } catch (err) {
      showToast(err.error || 'Failed to resolve alert.', 'error');
    }
  };

  const handleFreezeUser = async () => {
    if (!selectedAlert) return;
    try {
      const data = await api.containAlert(token, selectedAlert.id);
      showToast(data.message || 'User account frozen', 'success');
      setAiAlerts(prev => prev.map(a => a.id === selectedAlert.id ? { ...a, status: 'CONTAINED' } : a));
      setSelectedAlert(prev => ({ ...prev, status: 'CONTAINED' }));
    } catch (err) {
      showToast(err.error || 'Failed to freeze account.', 'error');
    }
  };

  // ─── Graph Data Preparation (from AlertReviewModal logic) ───
  const getActionRisk = (action) => {
    const act = action.toLowerCase();
    if (act.includes('admin') || act.includes('config') || act.includes('staff')) return 90;
    if (act.includes('transfer')) return 70;
    if (act.includes('login') || act.includes('logout')) return 10;
    return 30;
  };

  const actionSequence = activityData.logs.slice().reverse().map((log) => ({
    time: new Date(log.timestamp + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    action: log.action,
    risk: getActionRisk(log.action),
    id: log.id
  }));

  const txHistory = activityData.transactions.slice().reverse().map((tx) => ({
    time: new Date(tx.timestamp + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    amount: parseFloat(tx.amount),
    type: tx.type,
    id: tx.id
  }));

  const description = selectedAlert?.description || '';
  const isBurst = description.toLowerCase().includes('burst');
  const hasTransactions = txHistory.length > 0;
  const isTransactionAnomaly = description.toLowerCase().includes('transfer') || description.toLowerCase().includes('transaction') || hasTransactions;

  const getFrequencyData = () => {
    const freqMap = {};
    activityData.logs.forEach(log => {
      const time = new Date(log.timestamp + 'Z');
      const key = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      freqMap[key] = (freqMap[key] || 0) + 1;
    });
    return Object.keys(freqMap).sort().map(k => ({ time: k, count: freqMap[k] }));
  };

  const getDistributionData = () => {
    const distMap = {};
    activityData.logs.forEach(log => {
      let cat = 'Other';
      const action = log.action.toLowerCase();
      if (action.includes('/auth') || action.includes('login')) cat = 'Auth';
      else if (action.includes('/transactions') || action.includes('transfer')) cat = 'Transactions';
      else if (action.includes('/admin')) cat = 'Admin';
      else if (action.includes('/staff')) cat = 'Staff';
      else if (action.includes('/config')) cat = 'Config';
      distMap[cat] = (distMap[cat] || 0) + 1;
    });
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return Object.keys(distMap).map((key, index) => ({
      name: key,
      value: distMap[key],
      color: colors[index % colors.length]
    }));
  };

  const freqData = isBurst ? getFrequencyData() : [];
  const distData = (!isTransactionAnomaly && !isBurst) ? getDistributionData() : [];

  const sidebarItems = [
    { key: 'security', label: t('dashboard.securityAi'), icon: Shield },
    { key: 'staff', label: t('dashboard.staffManagement'), icon: Users },
    { key: 'branch', label: t('dashboard.branchOperations'), icon: Building },
    { key: 'compliance', label: t('dashboard.compliance'), icon: FileText },
  ];

  const parsed = selectedAlert ? parseDescription(selectedAlert.description) : null;
  const riskScore = selectedAlert ? parseRiskScore(selectedAlert.description) : null;
  const riskColors = parsed ? (RISK_COLORS[parsed.riskLevel] || RISK_COLORS.UNKNOWN) : RISK_COLORS.UNKNOWN;

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="sa-layout">
        {/* ── Sidebar Navigation ── */}
        <nav className="sa-sidebar">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`sa-sidebar-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => { setActiveTab(item.key); setSelectedAlert(null); }}
              >
                <Icon className="sa-sidebar-icon" size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Main Content ── */}
        <div className="sa-main">
          {/* Compact Welcome Strip */}
          <div className="sa-welcome-strip">
            <div className="sa-welcome-left">
              <div className="sa-welcome-avatar">
                {(username || 'SA').slice(0, 2).toUpperCase()}
              </div>
              <div className="sa-welcome-text">
                <h2>{t('dashboard.welcome')}, {username}</h2>
                <p>{t('login.subtitle')}</p>
              </div>
            </div>
            <div className="sa-welcome-right">
              <div className="sa-stat-pill">
                <span className={`sa-stat-dot ${highAlerts.length > 0 ? 'red' : 'green'}`} />
                {highAlerts.length} {t('dashboard.high')}
              </div>
              <div className="sa-stat-pill">
                <span className="sa-stat-dot blue" />
                {openAlerts.length} {t('dashboard.statusOpen')}
              </div>
              <div className="sa-stat-pill">
                <span className="sa-stat-dot green" />
                {users.length} {t('dashboard.allRoles').replace('All ', '')}
              </div>
            </div>
          </div>

          {/* Content + Detail Panel Split */}
          <div className="sa-content-split">
            <div className={`sa-content-main ${selectedAlert && activeTab === 'security' ? 'with-panel' : ''}`}>
              {activeTab === 'security' && (
                <SecurityTab
                  aiAlerts={aiAlerts}
                  setAiAlerts={setAiAlerts}
                  users={users}
                  token={token}
                  logs={logs}
                  transactionRequests={transactionRequests}
                  onAlertClick={handleAlertClick}
                  selectedAlertId={selectedAlert?.id}
                />
              )}

              {activeTab === 'staff' && (
                <StaffManagementTab
                  users={users}
                  branches={branches}
                  token={token}
                />
              )}

              {activeTab === 'branch' && (
                <BranchOperationsTab
                  branches={branches}
                  setBranches={setBranches}
                  token={token}
                  users={users}
                />
              )}

              {activeTab === 'compliance' && (
                <div className="admin-tab-content animated-fade-in">
                  <AuditLogTable logs={logs} users={users} token={token} />
                </div>
              )}
            </div>

            {/* ── Analytics Detail Panel (Right) ── */}
            {selectedAlert && activeTab === 'security' && (
              <div className="sa-detail-panel">
                <div className="sa-detail-header">
                  <h3>Risk Analysis</h3>
                  <button className="sa-detail-close" onClick={() => setSelectedAlert(null)}>
                    <X size={14} />
                  </button>
                </div>
                <div className="sa-detail-body">
                  {/* User Card */}
                  <div className="sa-risk-user-card">
                    <div className={`sa-risk-user-avatar ${selectedAlert.status.toLowerCase()}`}>
                      {selectedAlert.flaggedUsername.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="sa-risk-user-info">
                      <h4>{selectedAlert.flaggedUsername}</h4>
                      <span>{getUserRole(selectedAlert.flaggedUsername)} · Alert #{selectedAlert.id}</span>
                    </div>
                  </div>

                  {/* ── Graphs Section (Moved to Top) ── */}
                  {activityLoading ? (
                    <div className="sa-graph-loading">
                      <div className="sa-loading-spinner" />
                      <span>Loading forensic data...</span>
                    </div>
                  ) : activityError ? (
                    <div className="sa-graph-error">Error: {activityError}</div>
                  ) : (
                    <div className="sa-graphs-section">
                      {/* Action Sequence Graph */}
                      {actionSequence.length > 0 && (
                        <div className="sa-graph-card">
                          <div className="sa-graph-header">
                            <Activity size={16} className="icon-blue" />
                            <h5>Action Sequence & Risk</h5>
                          </div>
                          <div className="sa-graph-body">
                            <ResponsiveContainer width="100%" height={220}>
                              <AreaChart data={actionSequence} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(239,68,68,0.25)" />
                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-light)' }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-light)' }} />
                                <Tooltip
                                  contentStyle={{
                                    background: 'var(--primary-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                  }}
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div style={{ padding: '8px 12px', background: 'var(--primary-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-light)' }}>{data.time}</p>
                                          <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: 700, color: 'var(--text-color)' }}>{data.action}</p>
                                          <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 700, color: data.risk >= 70 ? '#EF4444' : data.risk >= 50 ? '#F59E0B' : '#22C55E' }}>Risk: {data.risk}%</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Area type="monotone" dataKey="risk" stroke="#EF4444" strokeWidth={2} fill="url(#riskGradient)" dot={{ r: 3, fill: '#EF4444' }} activeDot={{ r: 6 }} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Secondary Graph */}
                      {isBurst && freqData.length > 0 ? (
                        <div className="sa-graph-card">
                          <div className="sa-graph-header">
                            <BarChart2 size={16} className="icon-blue" />
                            <h5>Burst Analysis</h5>
                          </div>
                          <div className="sa-graph-body">
                            <ResponsiveContainer width="100%" height={220}>
                              <BarChart data={freqData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-light)' }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-light)' }} />
                                <Tooltip
                                  contentStyle={{
                                    background: 'var(--primary-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                  }}
                                />
                                <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ) : isTransactionAnomaly ? (
                        <div className="sa-graph-card">
                          <div className="sa-graph-header">
                            <Database size={16} className="icon-blue" />
                            <h5>Transaction Amounts</h5>
                          </div>
                          <div className="sa-graph-body">
                            {txHistory.length > 0 ? (
                              <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={txHistory} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-light)' }} />
                                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-light)' }} />
                                  <Tooltip
                                    formatter={(value) => [`₹${value}`, 'Amount']}
                                    labelFormatter={(label) => `Time: ${label}`}
                                    contentStyle={{
                                      background: 'var(--primary-bg)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '8px',
                                      fontSize: '12px'
                                    }}
                                  />
                                  <Area type="stepAfter" dataKey="amount" stroke="#3B82F6" strokeWidth={2} fill="url(#txGradient)" dot={{ r: 3, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                                </AreaChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="sa-no-data">No recent transactions found.</div>
                            )}
                          </div>
                        </div>
                      ) : distData.length > 0 ? (
                        <div className="sa-graph-card">
                          <div className="sa-graph-header">
                            <PieChartIcon size={16} className="icon-blue" />
                            <h5>Action Distribution</h5>
                          </div>
                          <div className="sa-graph-body" style={{ display: 'flex', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height={220}>
                              <PieChart>
                                <Pie data={distData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} label={{ fontSize: 10 }}>
                                  {distData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    background: 'var(--primary-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Half Circular Risk Gauge */}
                  {riskScore !== null && (
                    <div className="sa-gauge-wrapper">
                      <LargeRiskGauge value={riskScore} />
                    </div>
                  )}

                  {/* Risk Details */}
                  <div className="sa-risk-details">
                    {/* Severity */}
                    <div className="sa-risk-detail-card">
                      <h5>Severity</h5>
                      <p>
                        <span className={`severity-badge ${selectedAlert.severity.toLowerCase()}`}>
                          {selectedAlert.severity}
                        </span>
                        {' '} — {selectedAlert.status}
                      </p>
                    </div>

                    {/* AI Analysis — Structured Description */}
                    <div className="sa-risk-detail-card sa-description-card">
                      <h5>AI Analysis</h5>
                      {parsed ? (
                        <div className="sa-structured-desc">
                          {/* Risk summary header */}
                          <div className="sa-risk-summary-badge" style={{
                            background: riskColors.bg,
                            borderColor: riskColors.border,
                            color: riskColors.text
                          }}>
                            <span style={{ fontSize: '16px' }}>
                              {parsed.riskLevel === 'HIGH' ? '🚨' : parsed.riskLevel === 'MEDIUM' ? '⚠️' : 'ℹ️'}
                            </span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '12px' }}>
                                {parsed.riskLevel} RISK
                                {parsed.riskScore && <span style={{ marginLeft: '6px', fontWeight: 400, fontSize: '11px' }}>Score: {parsed.riskScore}%</span>}
                              </div>
                            </div>
                          </div>

                          {/* Per-signal cards */}
                          {parsed.signals.map((sig, i) => (
                            <div key={i} className="sa-signal-card" style={{ borderLeftColor: riskColors.accent }}>
                              <span className="sa-signal-icon">{sig.icon}</span>
                              <div>
                                <div className="sa-signal-label" style={{ color: riskColors.text }}>{sig.label}</div>
                                <div className="sa-signal-body">{sig.body}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '12px', lineHeight: 1.6 }}>
                          {selectedAlert.description || 'No description available'}
                        </p>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="sa-risk-detail-card">
                      <h5>Detected At</h5>
                      <p>{new Date(selectedAlert.timestamp + 'Z').toLocaleString()}</p>
                    </div>
                  </div>

                  {/* ── Action Buttons ── */}
                  <div className="sa-detail-actions">
                    <button
                      className="sa-action-btn sa-resolve-btn"
                      onClick={handleResolveAlert}
                      disabled={selectedAlert.status === 'RESOLVED'}
                    >
                      {selectedAlert.status === 'RESOLVED' ? '✓ Resolved' : '✓ Resolve'}
                    </button>
                    <button
                      className="sa-action-btn sa-freeze-btn"
                      onClick={handleFreezeUser}
                      disabled={selectedAlert.status === 'CONTAINED' || selectedAlert.status === 'RESOLVED'}
                    >
                      {selectedAlert.status === 'CONTAINED' ? '🔒 Frozen' : '🔒 Freeze'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
