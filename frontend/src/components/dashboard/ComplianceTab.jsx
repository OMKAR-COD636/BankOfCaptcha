import React, { useState } from 'react';
import { FileText, Search, Filter } from 'lucide-react';
import Pagination from '../Pagination';

const ComplianceTab = ({
  logs,
  users,
  handleVerifyLog,
  itemsPerPage
}) => {
  const [logFilter, setLogFilter] = useState({ search: '', role: '' });
  const [logPage, setLogPage] = useState(1);

  let filteredLogs = logs;
  if (logFilter.search) {
    filteredLogs = filteredLogs.filter(l => l.username.toLowerCase().includes(logFilter.search.toLowerCase()));
  }
  if (logFilter.role) {
    filteredLogs = filteredLogs.filter(l => {
      const u = users.find(u => u.username === l.username);
      return u && u.role === `ROLE_${logFilter.role}`;
    });
  }

  const paginatedLogs = filteredLogs.slice((logPage - 1) * itemsPerPage, logPage * itemsPerPage);

  return (
    <div className="admin-tab-content animated-fade-in">
      <h2 className="section-title"><FileText size={24} className="icon-blue" /> System Audit Logs</h2>
      
      <div className="alert-filters">
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="filter-group">
            <Search size={16} className="filter-icon" />
            <input type="text" placeholder="Search by username..." value={logFilter.search} onChange={e => setLogFilter({...logFilter, search: e.target.value})} className="filter-input" />
          </div>
          <div className="filter-group">
            <Filter size={16} className="filter-icon" />
            <select value={logFilter.role} onChange={e => setLogFilter({...logFilter, role: e.target.value})} className="filter-select">
              <option value="">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="TELLER">Teller</option>
              <option value="BRANCH_MANAGER">Branch Manager</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
            </select>
          </div>
        </div>
      </div>

      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Username</th>
              <th>Role</th>
              <th>Action Details</th>
              <th>Validation</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map(log => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{new Date(log.timestamp + 'Z').toLocaleString()}</td>
                <td><strong>{log.username}</strong></td>
                <td><span className="role-badge">{users.find(u => u.username === log.username)?.role?.replace('ROLE_', '') || 'UNKNOWN'}</span></td>
                <td>{log.action}</td>
                <td>
                  <button onClick={() => handleVerifyLog(log.id)} style={{ padding: '4px 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Verify Integrity</button>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#6b7280' }}>No audit logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination currentPage={logPage} totalItems={filteredLogs.length} itemsPerPage={itemsPerPage} onPageChange={setLogPage} />
      </div>
    </div>
  );
};

export default ComplianceTab;
