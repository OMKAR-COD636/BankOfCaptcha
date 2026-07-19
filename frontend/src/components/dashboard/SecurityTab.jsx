import React, { useState } from 'react';
import { AlertTriangle, FileText, Activity, Search, Filter } from 'lucide-react';
import RiskActivityGraph from '../RiskActivityGraph';
import RiskHeatmap from '../RiskHeatmap';
import Pagination from '../Pagination';

const SecurityTab = ({
  aiAlerts,
  logs,
  transactionRequests,
  users,
  handleResolveAllAlerts,
  handleResolveAlert,
  setSelectedAlertForReview,
  handleFalsePositive,
  itemsPerPage
}) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMatrix, setSelectedMatrix] = useState(null);
  const [alertFilter, setAlertFilter] = useState({ search: '', severity: '', status: '', role: '' });
  const [alertPage, setAlertPage] = useState(1);
  const [showFeedbackColumn, setShowFeedbackColumn] = useState(false);

  // Derive filtered logs (for the counts)
  const filteredLogs = logs.filter(log => log.username.toLowerCase().includes(alertFilter.search.toLowerCase()));

  // Filter alerts
  let filteredAlerts = aiAlerts;
  if (alertFilter.search) filteredAlerts = filteredAlerts.filter(a => a.flaggedUsername.toLowerCase().includes(alertFilter.search.toLowerCase()));
  if (alertFilter.severity) filteredAlerts = filteredAlerts.filter(a => a.severity === alertFilter.severity);
  if (alertFilter.status) filteredAlerts = filteredAlerts.filter(a => a.status === alertFilter.status);
  if (alertFilter.role) {
    filteredAlerts = filteredAlerts.filter(a => {
      const u = users.find(u => u.username === a.flaggedUsername);
      return u && u.role === `ROLE_${alertFilter.role}`;
    });
  }
  
  if (selectedDate) {
    filteredAlerts = filteredAlerts.filter(a => a.timestamp.startsWith(selectedDate));
  }
  if (selectedMatrix) {
    filteredAlerts = filteredAlerts.filter(a => {
      const isHigh = a.severity === 'HIGH';
      const isMedium = a.severity === 'MEDIUM';
      const isLow = a.severity === 'LOW';
      if (selectedMatrix.risk === 'High' && !isHigh) return false;
      if (selectedMatrix.risk === 'Medium' && !isMedium) return false;
      if (selectedMatrix.risk === 'Low' && !isLow) return false;
      
      const role = users.find(u => u.username === a.flaggedUsername)?.role?.replace('ROLE_', '') || 'UNKNOWN';
      return role === selectedMatrix.role;
    });
  }

  const paginatedAlerts = filteredAlerts.slice((alertPage - 1) * itemsPerPage, alertPage * itemsPerPage);

  return (
    <div className="admin-tab-content animated-fade-in">
      <div className="risk-intelligence-center" style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
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

      <div className="summary-cards-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="summary-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <AlertTriangle size={20} className="icon-yellow" />
            <h3 style={{ margin: 0, color: '#475569', fontSize: '1rem' }}>Filtered Alerts</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>{filteredAlerts.length}</div>
        </div>
        <div className="summary-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <FileText size={20} className="icon-blue" />
            <h3 style={{ margin: 0, color: '#475569', fontSize: '1rem' }}>Filtered Audit Logs</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>{filteredLogs.length}</div>
        </div>
        <div className="summary-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Activity size={20} className="icon-blue" />
            <h3 style={{ margin: 0, color: '#475569', fontSize: '1rem' }}>Pending Requests</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>{transactionRequests.length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}><AlertTriangle size={24} className="icon-yellow" /> AI Security Alerts</h2>
        <button onClick={handleResolveAllAlerts} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Resolve & Unfreeze All
        </button>
      </div>
      
      <div className="alert-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="filter-group">
            <Search size={16} className="filter-icon" />
            <input type="text" placeholder="Search by username..." value={alertFilter.search} onChange={e => setAlertFilter({...alertFilter, search: e.target.value})} className="filter-input" />
          </div>
          <div className="filter-group">
            <Filter size={16} className="filter-icon" />
            <select value={alertFilter.role} onChange={e => setAlertFilter({...alertFilter, role: e.target.value})} className="filter-select">
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
            <select value={alertFilter.severity} onChange={e => setAlertFilter({...alertFilter, severity: e.target.value})} className="filter-select">
              <option value="">All Severities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div className="filter-group">
            <Filter size={16} className="filter-icon" />
            <select value={alertFilter.status} onChange={e => setAlertFilter({...alertFilter, status: e.target.value})} className="filter-select">
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>
            <input 
              type="checkbox" 
              checked={showFeedbackColumn} 
              onChange={e => setShowFeedbackColumn(e.target.checked)} 
            />
            Enable AI Feedback
          </label>
        </div>
      </div>

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
              {showFeedbackColumn && <th>AI Feedback</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAlerts.map(alert => (
              <tr key={alert.id} className={alert.severity === 'HIGH' ? 'row-danger' : ''}>
                <td>{alert.id}</td>
                <td><strong>{alert.flaggedUsername}</strong></td>
                <td><span className="role-badge">{users.find(u => u.username === alert.flaggedUsername)?.role?.replace('ROLE_', '') || 'UNKNOWN'}</span></td>
                <td><span className={`severity-badge ${alert.severity.toLowerCase()}`}>{alert.severity}</span></td>
                <td>{alert.description}</td>
                <td><strong>{alert.status}</strong></td>
                <td>{new Date(alert.timestamp + 'Z').toLocaleString()}</td>
                {showFeedbackColumn && (
                  <td>
                    <button 
                      onClick={() => handleFalsePositive(alert.id, alert.isFalsePositive)} 
                      style={{ 
                        padding: '4px 8px', 
                        background: alert.isFalsePositive ? '#ef4444' : '#e2e8f0', 
                        color: alert.isFalsePositive ? 'white' : '#475569', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                      {alert.isFalsePositive ? 'False Positive' : 'Mark FP'}
                    </button>
                  </td>
                )}
                <td>
                  {alert.status === 'OPEN' && (
                     <button onClick={() => handleResolveAlert(alert.id)} style={{ padding: '4px 8px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Resolve</button>
                  )}
                  <button onClick={() => setSelectedAlertForReview(alert)} style={{ padding: '4px 8px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Review</button>
                </td>
              </tr>
            ))}
            {filteredAlerts.length === 0 && (
              <tr>
                <td colSpan={showFeedbackColumn ? "9" : "8"} style={{ textAlign: 'center', color: '#6b7280' }}>No alerts found matching the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination currentPage={alertPage} totalItems={filteredAlerts.length} itemsPerPage={itemsPerPage} onPageChange={setAlertPage} />
      </div>
    </div>
  );
};

export default SecurityTab;
