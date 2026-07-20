import { useEffect, useState } from 'react';
import { AlertTriangle, Activity, Search, Filter } from 'lucide-react';
import Pagination from '../../components/shared/Pagination';
import RiskActivityGraph from '../../components/RiskActivityGraph';
import RiskHeatmap from '../../components/RiskHeatmap';
import AlertReviewModal from '../../components/AlertReviewModal';
import * as api from '../../api/client';

/**
 * SuperAdmin — Security & Intelligence Tab
 * Shows: Risk graphs, summary cards, AI alerts table with filters.
 */
const SecurityTab = ({ aiAlerts, setAiAlerts, users, token, logs, transactionRequests }) => {
  const [alertFilter, setAlertFilter] = useState({ search: '', severity: '', status: '', role: '' });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMatrix, setSelectedMatrix] = useState(null);
  const [selectedAlertForReview, setSelectedAlertForReview] = useState(null);
  const [alertPage, setAlertPage] = useState(1);
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
            <h3>Filtered Alerts</h3>
          </div>
          <div className="summary-card-value">{filteredAlerts.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-header">
            <Activity size={20} className="icon-blue" />
            <h3>Filtered Audit Logs</h3>
          </div>
          <div className="summary-card-value">{filteredLogs.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-header">
            <Activity size={20} className="icon-blue" />
            <h3>Pending Requests</h3>
          </div>
          <div className="summary-card-value">{transactionRequests.length}</div>
        </div>
      </div>

      {/* AI Security Alerts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          <AlertTriangle size={24} className="icon-yellow" /> AI Security Alerts
        </h2>
        <button onClick={handleResolveAllAlerts} className="btn-primary">
          Resolve & Unfreeze All
        </button>
      </div>

      {/* Filters */}
      <div className="alert-filters">
        <div className="filter-group">
          <Search size={16} className="filter-icon" />
          <input
            type="text"
            placeholder="Search by username..."
            value={alertFilter.search}
            onChange={(e) => setAlertFilter({ ...alertFilter, search: e.target.value })}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <select value={alertFilter.role} onChange={(e) => setAlertFilter({ ...alertFilter, role: e.target.value })} className="filter-select">
            <option value="">All Roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="TELLER">Teller</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
          </select>
        </div>
        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <select value={alertFilter.severity} onChange={(e) => setAlertFilter({ ...alertFilter, severity: e.target.value })} className="filter-select">
            <option value="">All Severities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <select value={alertFilter.status} onChange={(e) => setAlertFilter({ ...alertFilter, status: e.target.value })} className="filter-select">
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Flagged User</th>
              <th>User Role</th>
              <th>Severity</th>
              <th>Description</th>
              <th>Status</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAlerts.map((alert) => (
              <tr key={alert.id} className={alert.severity === 'HIGH' ? 'row-danger' : ''}>
                <td>{alert.id}</td>
                <td><strong>{alert.flaggedUsername}</strong></td>
                <td><span className="role-badge">{getUserRole(alert.flaggedUsername)}</span></td>
                <td><span className={`severity-badge ${alert.severity.toLowerCase()}`}>{alert.severity}</span></td>
                <td>{alert.description}</td>
                <td><strong>{alert.status}</strong></td>
                <td>{new Date(alert.timestamp + 'Z').toLocaleString()}</td>
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
                <td colSpan="8" style={{ textAlign: 'center', color: '#6b7280' }}>
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
