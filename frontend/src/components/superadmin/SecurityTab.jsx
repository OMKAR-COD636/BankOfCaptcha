import { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { AlertTriangle, Activity, Search, Filter, ThumbsDown, ShieldAlert } from 'lucide-react';
import Pagination from '../../components/shared/Pagination';
import RiskActivityGraph from '../../components/RiskActivityGraph';
import RiskHeatmap from '../../components/RiskHeatmap';
import { useToast } from '../../components/shared/ToastContext';
import * as api from '../../api/client';
import './SecurityTab.css';

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
  const riskScore = scoreMatch ? parseInt(scoreMatch[1]) : null;

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

// Parse risk score from alert description
const parseRiskScore = (description) => {
  if (!description) return null;
  const match = description.match(/(\d+)%/);
  return match ? parseInt(match[1]) : null;
};

// ---------------------------------------------------------------------------
// Circular Risk Gauge (compact, for card list)
// ---------------------------------------------------------------------------
const CircularGauge = ({ value, size = 48 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  let color = '#22C55E'; // green
  if (value >= 70) color = '#EF4444'; // red
  else if (value >= 50) color = '#F59E0B'; // amber
  else if (value >= 30) color = '#3B82F6'; // blue

  return (
    <div className="sec-card-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="gauge-bg"
          cx={size / 2} cy={size / 2} r={radius}
        />
        <circle
          className="gauge-fill"
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="gauge-value" style={{ color }}>
        {value}%
      </div>
    </div>
  );
};

/**
 * SuperAdmin — Security & Intelligence Tab
 * Shows: Risk graphs, summary cards, flagged-user card-list with circular gauges.
 * Clicking a card triggers the detail panel in the parent (SuperAdminDashboard).
 */
const SecurityTab = ({ aiAlerts, setAiAlerts, users, token, logs, transactionRequests, onAlertClick, selectedAlertId }) => {
  const { t } = useTranslation();
  const showToast = useToast();
  const [alertFilter, setAlertFilter] = useState({ search: '', severity: '', status: '', role: '' });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMatrix, setSelectedMatrix] = useState(null);
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

  const handleResolveAllAlerts = async () => {
    try {
      const data = await api.resolveAllAlerts(token);
      showToast(data.message, 'success');
      setAiAlerts((prev) => prev.map((a) => ({ ...a, status: 'RESOLVED' })));
    } catch (err) {
      showToast(err.error || 'Failed to resolve all alerts.', 'error');
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
      showToast(err.error || 'Failed to save feedback. Please try again.', 'error');
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
      {/* ── Summary Cards Row ── */}
      <div className="sec-summary-row">
        <div className="sec-summary-card alerts">
          <div className="sec-summary-icon alerts">
            <AlertTriangle size={22} />
          </div>
          <div className="sec-summary-info">
            <h4>{t('dashboard.filteredAlerts')}</h4>
            <div className="sec-summary-value">{filteredAlerts.length}</div>
          </div>
        </div>
        <div className="sec-summary-card logs">
          <div className="sec-summary-icon logs">
            <Activity size={22} />
          </div>
          <div className="sec-summary-info">
            <h4>{t('dashboard.filteredAuditLogs')}</h4>
            <div className="sec-summary-value">{filteredLogs.length}</div>
          </div>
        </div>
        <div className="sec-summary-card pending">
          <div className="sec-summary-icon pending">
            <Activity size={22} />
          </div>
          <div className="sec-summary-info">
            <h4>{t('dashboard.pendingRequests')}</h4>
            <div className="sec-summary-value">{transactionRequests.length}</div>
          </div>
        </div>
      </div>

      {/* ── Risk Intelligence Graphs ── */}
      <div className="sec-graphs-row">
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

      {/* ── Flagged Users Header ── */}
      <div className="sec-header-bar">
        <h2 className="sec-title">
          <AlertTriangle size={22} className="icon-yellow" />
          AI Security Alerts
        </h2>
        <div className="sec-header-actions">
          {/* AI Feedback opt-in chip */}
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

      {/* ── Compact Filters ── */}
      <div className="sec-filters">
        <div className="sec-filter-group">
          <Search size={15} className="filter-icon" />
          <input
            type="text"
            placeholder={t("dashboard.searchUsername")}
            value={alertFilter.search}
            onChange={(e) => setAlertFilter({ ...alertFilter, search: e.target.value })}
          />
        </div>
        <div className="sec-filter-group">
          <Filter size={15} className="filter-icon" />
          <select value={alertFilter.role} onChange={(e) => setAlertFilter({ ...alertFilter, role: e.target.value })}>
            <option value="">{t('dashboard.allRoles')}</option>
            <option value="CUSTOMER">{t('dashboard.roleCustomer')}</option>
            <option value="TELLER">{t('dashboard.roleTeller')}</option>
            <option value="BRANCH_MANAGER">{t('dashboard.roleBranchManager')}</option>
            <option value="ADMIN">{t('dashboard.roleAdmin')}</option>
            <option value="SUPER_ADMIN">{t('dashboard.roleSuperAdmin')}</option>
            <option value="COMPLIANCE_OFFICER">{t('dashboard.roleComplianceOfficer')}</option>
          </select>
        </div>
        <div className="sec-filter-group">
          <Filter size={15} className="filter-icon" />
          <select value={alertFilter.severity} onChange={(e) => setAlertFilter({ ...alertFilter, severity: e.target.value })}>
            <option value="">{t('dashboard.allSeverities')}</option>
            <option value="HIGH">{t('dashboard.high')}</option>
            <option value="MEDIUM">{t('dashboard.medium')}</option>
            <option value="LOW">{t('dashboard.low')}</option>
          </select>
        </div>
        <div className="sec-filter-group">
          <Filter size={15} className="filter-icon" />
          <select value={alertFilter.status} onChange={(e) => setAlertFilter({ ...alertFilter, status: e.target.value })}>
            <option value="">{t('dashboard.allStatuses')}</option>
            <option value="OPEN">{t('dashboard.statusOpen')}</option>
            <option value="RESOLVED">{t('dashboard.statusResolved')}</option>
          </select>
        </div>
      </div>

      {/* ── Flagged Users Card List ── */}
      <div className="sec-card-list">
        {paginatedAlerts.map((alert) => {
          const riskScore = parseRiskScore(alert.description);
          const role = getUserRole(alert.flaggedUsername);
          const isSelected = selectedAlertId === alert.id;
          const avatarClass = alert.status === 'RESOLVED' ? 'resolved' : alert.severity.toLowerCase();
          const timeStr = new Date(alert.timestamp + 'Z').toLocaleString([], {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });

          return (
            <div
              key={alert.id}
              className={`sec-alert-card severity-${alert.severity.toLowerCase()} ${isSelected ? 'selected' : ''}`}
              onClick={() => onAlertClick && onAlertClick(alert)}
            >
              {/* Avatar */}
              <div className={`sec-card-avatar ${avatarClass}`}>
                {alert.flaggedUsername.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="sec-card-info">
                <div className="sec-card-name">{alert.flaggedUsername}</div>
                <div className="sec-card-meta">
                  <span className="sec-card-role">{role}</span>
                  <span className={`sec-card-status ${alert.status.toLowerCase()}`}>{alert.status}</span>
                  <span className="sec-card-time">{timeStr}</span>
                </div>
              </div>

              {/* AI Feedback toggle (inline, when enabled) */}
              {showFeedbackColumn && (
                <label
                  className={`fp-toggle-label ${
                    alert.isFalsePositive ? 'fp-toggle-label--active' : ''
                  } ${
                    pendingFeedback.has(alert.id) ? 'fp-toggle-label--pending' : ''
                  }`}
                  title={alert.isFalsePositive ? 'Marked as false positive' : 'Mark as false positive'}
                  onClick={(e) => e.stopPropagation()}
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
                </label>
              )}

              {/* Circular Risk Gauge */}
              {riskScore !== null && (
                <CircularGauge value={riskScore} />
              )}

              {/* Severity Badge */}
              <span className={`severity-badge ${alert.severity.toLowerCase()}`}>
                {alert.severity}
              </span>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="sec-empty-state">
            <ShieldAlert size={48} />
            <p>No alerts found matching the current filters.</p>
            <span>Try adjusting your search or filter criteria.</span>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={alertPage}
        totalItems={filteredAlerts.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setAlertPage}
      />
    </div>
  );
};

export default SecurityTab;
