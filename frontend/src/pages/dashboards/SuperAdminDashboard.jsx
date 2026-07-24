import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Shield, Users, Building, FileText, AlertTriangle, Activity, X } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import SecurityTab from '../../components/superadmin/SecurityTab';
import StaffManagementTab from '../../components/superadmin/StaffManagementTab';
import BranchOperationsTab from '../../components/superadmin/BranchOperationsTab';
import AuditLogTable from '../../components/shared/AuditLogTable';
import useAuth from '../../hooks/useAuth';
import * as api from '../../api/client';
import './SuperAdminDashboard.css';
import '../../components/shared/DashboardShell.css';

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

  useEffect(() => {
    api.fetchAuditLogs(token).then(setLogs).catch(console.error);
    api.fetchAiAlerts(token).then(setAiAlerts).catch(console.error);
    api.fetchUsers(token).then(setUsers).catch(console.error);
    api.fetchBranches(token).then(setBranches).catch(console.error);
  }, [token]);

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

  const parseRiskLevel = (description) => {
    if (!description) return 'UNKNOWN';
    if (description.startsWith('HIGH')) return 'HIGH';
    if (description.startsWith('MEDIUM')) return 'MEDIUM';
    if (description.startsWith('LOW')) return 'LOW';
    return 'UNKNOWN';
  };

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
  };

  const sidebarItems = [
    { key: 'security', label: t('dashboard.securityAi'), icon: Shield },
    { key: 'staff', label: t('dashboard.staffManagement'), icon: Users },
    { key: 'branch', label: t('dashboard.branchOperations'), icon: Building },
    { key: 'compliance', label: t('dashboard.compliance'), icon: FileText },
  ];

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
            <div className="sa-content-main">
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

            {/* ── Detail Panel (Right) ── */}
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

                    {/* Risk Score */}
                    {parseRiskScore(selectedAlert.description) && (
                      <div className="sa-risk-detail-card">
                        <h5>Risk Score</h5>
                        <p style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                          {parseRiskScore(selectedAlert.description)}%
                        </p>
                        <div className="sa-risk-score-bar">
                          <div
                            className={`sa-risk-score-fill ${parseRiskLevel(selectedAlert.description).toLowerCase()}`}
                            style={{ width: `${parseRiskScore(selectedAlert.description)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div className="sa-risk-detail-card">
                      <h5>AI Analysis</h5>
                      <p style={{ fontSize: '12px', lineHeight: 1.6 }}>
                        {selectedAlert.description || 'No description available'}
                      </p>
                    </div>

                    {/* Timestamp */}
                    <div className="sa-risk-detail-card">
                      <h5>Detected At</h5>
                      <p>{new Date(selectedAlert.timestamp + 'Z').toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="sa-detail-actions">
                    <button
                      className="btn-success"
                      style={{ padding: '10px', borderRadius: '8px', fontWeight: 700 }}
                      onClick={() => {
                        api.resolveAlert(token, selectedAlert.id).then(data => {
                          setAiAlerts(prev => prev.map(a => a.id === selectedAlert.id ? { ...a, status: 'RESOLVED' } : a));
                          setSelectedAlert(prev => ({ ...prev, status: 'RESOLVED' }));
                        }).catch(console.error);
                      }}
                      disabled={selectedAlert.status === 'RESOLVED'}
                    >
                      {selectedAlert.status === 'RESOLVED' ? '✓ Resolved' : 'Resolve Alert'}
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
