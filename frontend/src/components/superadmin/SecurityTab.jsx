import { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { AlertTriangle, Activity, Search, Filter, ThumbsDown } from 'lucide-react';
import Pagination from '../../components/shared/Pagination';
import RiskActivityGraph from '../../components/RiskActivityGraph';
import RiskHeatmap from '../../components/RiskHeatmap';
import AlertReviewModal from '../../components/AlertReviewModal';
import * as api from '../../api/client';

// ---------------------------------------------------------------------------
// Description Parser — converts the pipe-delimited AI description string into
// a structured object: { riskLevel, riskScore, signals: [{label, short}] }
// ---------------------------------------------------------------------------
const SIGNAL_LABELS = {
  'S1': 'S1 · Behavioral',
  'S2': 'S2 · Role Violation',
  'S3': 'S3 · Transaction',
  'S4': 'S4 · Temporal',
};

// Extracts a concise one-liner from a full signal sentence.
const shortenSignal = (text) => {
  // Remove the bracketed label prefix, e.g. "[S1 – Behavioral Anomaly] john (TELLER) ..."
  const withoutBracket = text.replace(/^\[.*?\]\s*/, '');
  // Take up to the first sentence or 90 chars, whichever comes first.
  const firstSentence = withoutBracket.split(/\.\s/)[0];
  return firstSentence.length > 90 ? firstSentence.slice(0, 87) + '…' : firstSentence;
};

const parseAlertDescription = (description) => {
  if (!description) return null;

  const parts = description.split(' | ').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  // First part is always the severity summary line
  const summaryLine = parts[0];

  // Extract risk level keyword
  let riskLevel = 'UNKNOWN';
  if (summaryLine.startsWith('HIGH')) riskLevel = 'HIGH';
  else if (summaryLine.startsWith('MEDIUM')) riskLevel = 'MEDIUM';
  else if (summaryLine.startsWith('LOW')) riskLevel = 'LOW';

  // Extract risk score percentage
  const scoreMatch = summaryLine.match(/(\d+)%/);
  const riskScore = scoreMatch ? scoreMatch[1] : null;

  // Remaining parts are signal messages — identify by bracket label
  const signals = parts.slice(1).map((part) => {
    // Detect which signal this belongs to
    const labelMatch = part.match(/^\[(S[1-4])\s*[–-]/);
    const signalKey = labelMatch ? labelMatch[1] : null;
    const label = signalKey ? (SIGNAL_LABELS[signalKey] || signalKey) : 'Signal';
    return { label, short: shortenSignal(part) };
  });

  return { riskLevel, riskScore, signals };
};

// Compact description cell shown in the table
const AlertDescriptionCell = ({ description }) => {
  const parsed = parseAlertDescription(description);

  if (!parsed) {
    return <span style={{ color: '#6b7280', fontSize: '12px' }}>{description || '—'}</span>;
  }

  const riskColors = {
    HIGH:   { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c' },
    MEDIUM: { bg: '#fffbeb', border: '#fcd34d', text: '#b45309' },
    LOW:    { bg: '#f0fdf4', border: '#86efac', text: '#15803d' },
  };
  const colors = riskColors[parsed.riskLevel] || { bg: '#f9fafb', border: '#e5e7eb', text: '#374151' };

  return (
    <div style={{ minWidth: '220px', maxWidth: '300px' }}>
      {/* Risk level badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '2px 8px', borderRadius: '10px', marginBottom: '6px',
        background: colors.bg, border: `1px solid ${colors.border}`,
        color: colors.text, fontWeight: '700', fontSize: '11px', letterSpacing: '0.04em',
      }}>
        {parsed.riskLevel} RISK{parsed.riskScore ? ` · ${parsed.riskScore}%` : ''}
      </div>

      {/* Per-signal short lines */}
      {parsed.signals.map((sig, i) => (
        <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '3px', lineHeight: '1.3' }}>
          <span style={{
            flexShrink: 0, fontSize: '10px', fontWeight: '700',
            color: colors.text, background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: '4px', padding: '1px 5px', whiteSpace: 'nowrap',
            alignSelf: 'flex-start', marginTop: '1px',
          }}>
            {sig.label}
          </span>
          <span style={{ fontSize: '11px', color: '#374151' }}>{sig.short}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * SuperAdmin — Security & Intelligence Tab
 * Shows: Risk graphs, summary cards, AI alerts table with filters.
 */
const SecurityTab = ({ aiAlerts, setAiAlerts, users, token, logs, transactionRequests }) => {
  const { t } = useTranslation();
  const [alertFilter, setAlertFilter] = useState({ search: '', severity: '', status: '', role: '' });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMatrix, setSelectedMatrix] = useState(null);
  const [selectedAlertForReview, setSelectedAlertForReview] = useState(null);
  const [alertPage, setAlertPage] = useState(1);
  // Tracks which alert IDs are currently mid-request (disables toggle during flight)
  const [pendingFeedback, setPendingFeedback] = useState(new Set());
  // Hidden by default — user must explicitly opt in to see the AI Feedback column
  const [showFeedbackColumn, setShowFeedbackColumn] = useState(false);
  const itemsPerPage = 20;

  const getUserRole = (username) =>
    users.find((u) => u.username === username)?.role?.replace('ROLE_', '') || 'UNKNOWN';

  const filteredAlerts = aiAlerts.filter((a) => {
    const matchesSearch = !alertFilter.search || a.flaggedUsername.toLowerCase().includes(alertFilter.search.toLowerCase());
    const matchesRole = !alertFilter.role || getUserRole(a.flaggedUsername) === alertFilter.role;
    const matchesSeverity = !alertFilter.severity || a.severity === alertFilter.severity;
    const matchesStatus = !alertFilter.status || a.status === alertFilter.status;
    const alertDate = new Date(a.timestamp + 'Z');
    const alertDateStr = alertDate.getFullYear() + '-' + String(alertDate.getMonth() + 1).padStart(2, '0') + '-' + String(alertDate.getDate()).padStart(2, '0');
    const matchesDate = !selectedDate || alertDateStr === selectedDate;
    const matchesMatrix = !selectedMatrix || a.severity === selectedMatrix.severity;
    return matchesSearch && matchesRole && matchesSeverity && matchesStatus && matchesDate && matchesMatrix;
  });

  const filteredLogs = logs.filter((log) => {
    if (!selectedDate) return true;
    const logDate = new Date(log.timestamp + 'Z');
    const logDateStr = logDate.getFullYear() + '-' + String(logDate.getMonth() + 1).padStart(2, '0') + '-' + String(logDate.getDate()).padStart(2, '0');
    return logDateStr === selectedDate;
  });

  const paginatedAlerts = filteredAlerts.slice((alertPage - 1) * itemsPerPage, alertPage * itemsPerPage);

  const handleResolveAlert = async (id) => {
    try {
      const data = await api.resolveAlert(token, id);
      alert(data.message);
      setAiAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' } : a)));
    } catch (err) {
      alert(err.error || 'Failed to resolve alert.');
    }
  };

  const handleResolveAllAlerts = async () => {
    try {
      const data = await api.resolveAllAlerts(token);
      alert(data.message);
      setAiAlerts((prev) => prev.map((a) => ({ ...a, status: 'RESOLVED' })));
    } catch (err) {
      alert(err.error || 'Failed to resolve all alerts.');
    }
  };

  /**
   * Toggles the isFalsePositive flag for an alert.
   * Calls PUT /api/ai/alerts/{id}/feedback → AlertService.setFeedback()
   * Alerts marked as false positives are consumed by the AI engine
   * during the next adaptive training run (triggered from the IT Admin panel).
   */
  const handleToggleFalsePositive = useCallback(async (alertId, currentValue) => {
    // Mark as in-flight to disable the toggle
    setPendingFeedback((prev) => new Set(prev).add(alertId));
    try {
      await api.updateAlertFeedback(token, alertId, !currentValue);
      // Optimistically update local state on success
      setAiAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isFalsePositive: !currentValue } : a))
      );
    } catch (err) {
      console.error('Failed to update alert feedback:', err);
      alert(err.error || 'Failed to save feedback. Please try again.');
    } finally {
      setPendingFeedback((prev) => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  }, [token, setAiAlerts]);

  return (
    <div className="admin-tab-content animated-fade-in">
      {selectedAlertForReview && (
        <AlertReviewModal
          alert={selectedAlertForReview}
          token={token}
          onClose={() => setSelectedAlertForReview(null)}
        />
      )}

      {/* Risk Intelligence Center */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <RiskActivityGraph
          alerts={aiAlerts}
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate}
        />
        <RiskHeatmap
          alerts={aiAlerts}
          onMatrixSelect={setSelectedMatrix}
          selectedMatrix={selectedMatrix}
        />
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-container">
        <div className="summary-card">
          <div className="summary-card-header">
            <AlertTriangle size={20} className="icon-yellow" />
            <h3>{t('dashboard.filteredAlerts')}</h3>
          </div>
          <div className="summary-card-value">{filteredAlerts.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-header">
            <Activity size={20} className="icon-blue" />
            <h3>{t('dashboard.filteredAuditLogs')}</h3>
          </div>
          <div className="summary-card-value">{filteredLogs.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-header">
            <Activity size={20} className="icon-blue" />
            <h3>{t('dashboard.pendingRequests')}</h3>
          </div>
          <div className="summary-card-value">{transactionRequests.length}</div>
        </div>
      </div>

      {/* AI Security Alerts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          <AlertTriangle size={24} className="icon-yellow" /> AI Security Alerts
        </h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Opt-in chip — column is hidden by default to keep the table clean */}
          <button
            className={`fp-opt-in-btn${showFeedbackColumn ? ' fp-opt-in-btn--active' : ''}`}
            onClick={() => setShowFeedbackColumn((v) => !v)}
            title="Toggle the AI Feedback column to mark alerts as false positives for model training"
          >
            <ThumbsDown size={13} />
            {showFeedbackColumn ? 'Hide AI Feedback' : 'AI Feedback'}
          </button>
          <button onClick={handleResolveAllAlerts} className="btn-primary">
            Resolve & Unfreeze All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="alert-filters">
        <div className="filter-group">
          <Search size={16} className="filter-icon" />
          <input
            type="text"
            placeholder={t("dashboard.searchUsername")}
            value={alertFilter.search}
            onChange={(e) => setAlertFilter({ ...alertFilter, search: e.target.value })}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <select value={alertFilter.role} onChange={(e) => setAlertFilter({ ...alertFilter, role: e.target.value })} className="filter-select">
            <option value="">{t('dashboard.allRoles')}</option>
            <option value="CUSTOMER">{t('dashboard.roleCustomer')}</option>
            <option value="TELLER">{t('dashboard.roleTeller')}</option>
            <option value="BRANCH_MANAGER">{t('dashboard.roleBranchManager')}</option>
            <option value="ADMIN">{t('dashboard.roleAdmin')}</option>
            <option value="SUPER_ADMIN">{t('dashboard.roleSuperAdmin')}</option>
            <option value="COMPLIANCE_OFFICER">{t('dashboard.roleComplianceOfficer')}</option>
          </select>
        </div>
        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <select value={alertFilter.severity} onChange={(e) => setAlertFilter({ ...alertFilter, severity: e.target.value })} className="filter-select">
            <option value="">{t('dashboard.allSeverities')}</option>
            <option value="HIGH">{t('dashboard.high')}</option>
            <option value="MEDIUM">{t('dashboard.medium')}</option>
            <option value="LOW">{t('dashboard.low')}</option>
          </select>
        </div>
        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <select value={alertFilter.status} onChange={(e) => setAlertFilter({ ...alertFilter, status: e.target.value })} className="filter-select">
            <option value="">{t('dashboard.allStatuses')}</option>
            <option value="OPEN">{t('dashboard.statusOpen')}</option>
            <option value="RESOLVED">{t('dashboard.statusResolved')}</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t('dashboard.flaggedUser')}</th>
              <th>{t('dashboard.userRole')}</th>
              <th>{t('dashboard.severity')}</th>
              <th>{t('dashboard.description')}</th>
              <th>{t('dashboard.status')}</th>
              <th>{t('dashboard.timestamp')}</th>
              {showFeedbackColumn && (
                <th style={{ whiteSpace: 'nowrap' }}>
                  <ThumbsDown size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                  AI Feedback
                </th>
              )}
              <th>{t('dashboard.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAlerts.map((alert) => (
              <tr key={alert.id} className={alert.severity === 'HIGH' ? 'row-danger' : ''}>
                <td>{alert.id}</td>
                <td><strong>{alert.flaggedUsername}</strong></td>
                <td><span className="role-badge">{getUserRole(alert.flaggedUsername)}</span></td>
                <td><span className={`severity-badge ${alert.severity.toLowerCase()}`}>{alert.severity}</span></td>
                <td><AlertDescriptionCell description={alert.description} /></td>
                <td><strong>{alert.status}</strong></td>
                <td>{new Date(alert.timestamp + 'Z').toLocaleString()}</td>
                {showFeedbackColumn && (
                  <td>
                    {/* False Positive toggle — feeds into the next adaptive training cycle */}
                    <label
                      className={`fp-toggle-label ${
                        alert.isFalsePositive ? 'fp-toggle-label--active' : ''
                      } ${
                        pendingFeedback.has(alert.id) ? 'fp-toggle-label--pending' : ''
                      }`}
                      title={alert.isFalsePositive ? 'Marked as false positive — will be used in next training' : 'Mark as false positive for AI training'}
                    >
                      <input
                        type="checkbox"
                        className="fp-toggle-input"
                        checked={!!alert.isFalsePositive}
                        disabled={pendingFeedback.has(alert.id)}
                        onChange={() => handleToggleFalsePositive(alert.id, !!alert.isFalsePositive)}
                      />
                      <span className="fp-toggle-track">
                        <span className="fp-toggle-thumb" />
                      </span>
                      <span className="fp-toggle-text">
                        {pendingFeedback.has(alert.id)
                          ? 'Saving…'
                          : alert.isFalsePositive
                            ? 'False Positive'
                            : 'Not FP'}
                      </span>
                    </label>
                  </td>
                )}
                <td>
                  {alert.status === 'OPEN' && (
                    <button className="btn-success" onClick={() => handleResolveAlert(alert.id)} style={{ marginRight: '5px' }}>
                      Resolve
                    </button>
                  )}
                  <button className="btn-warning" onClick={() => setSelectedAlertForReview(alert)}>
                    Review
                  </button>
                </td>
              </tr>
            ))}
            {filteredAlerts.length === 0 && (
              <tr>
                <td colSpan={showFeedbackColumn ? 9 : 8} style={{ textAlign: 'center', color: '#6b7280' }}>
                  No alerts found matching the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={alertPage}
          totalItems={filteredAlerts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setAlertPage}
        />
      </div>
    </div>
  );
};

export default SecurityTab;
