import React, { useState } from 'react';
import { FileText, ShieldAlert, Search, Filter } from 'lucide-react';
import Pagination from '../Pagination';

const ComplianceTab = ({
  logs,
  transactionRequests,
  kycRequests,
  handleVerifyLog,
  handleApprove,
  handleReject,
  itemsPerPage
}) => {
  const [logFilter, setLogFilter] = useState({ search: '', role: '' });
  const [logPage, setLogPage] = useState(1);
  const [txReqPage, setTxReqPage] = useState(1);
  const [kycReqPage, setKycReqPage] = useState(1);

  let filteredLogs = logs;
  if (logFilter.search) filteredLogs = filteredLogs.filter(l => l.username.toLowerCase().includes(logFilter.search.toLowerCase()));

  const paginatedLogs = filteredLogs.slice((logPage - 1) * itemsPerPage, logPage * itemsPerPage);
  const paginatedTxReqs = transactionRequests.slice((txReqPage - 1) * itemsPerPage, txReqPage * itemsPerPage);
  const paginatedKycReqs = kycRequests.slice((kycReqPage - 1) * itemsPerPage, kycReqPage * itemsPerPage);

  return (
    <div className="admin-tab-content animated-fade-in">
      <h2 className="section-title"><ShieldAlert size={24} className="icon-blue" /> Action Approvals (Manager)</h2>
      {transactionRequests.length > 0 ? (
        <div className="logs-table-container mb-4">
          <table className="logs-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Request Type</th>
                <th>Source Account</th>
                <th>Destination Account</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTxReqs.map(req => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td><strong>Transfer</strong></td>
                  <td>{req.sourceAccountNumber}</td>
                  <td>{req.destAccountNumber}</td>
                  <td><span className="currency">₹</span>{req.amount}</td>
                  <td><span className="status-badge pending">{req.status}</span></td>
                  <td>
                    <button onClick={() => handleApprove(req.id)} style={{ padding: '4px 8px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Approve</button>
                    <button onClick={() => handleReject(req.id)} style={{ padding: '4px 8px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={txReqPage} totalItems={transactionRequests.length} itemsPerPage={itemsPerPage} onPageChange={setTxReqPage} />
        </div>
      ) : (
        <div className="card mb-4" style={{ padding: '20px', background: 'white', borderRadius: '8px', color: '#64748b' }}>
          No pending transaction approvals.
        </div>
      )}
      
      <h2 className="section-title"><FileText size={24} className="icon-blue" /> System Audit Logs</h2>
      
      <div className="alert-filters">
        <div className="filter-group">
          <Search size={16} className="filter-icon" />
          <input type="text" placeholder="Search by username..." value={logFilter.search} onChange={e => setLogFilter({...logFilter, search: e.target.value})} className="filter-input" />
        </div>
      </div>

      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Username</th>
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
                <td>{log.action}</td>
                <td>
                  <button onClick={() => handleVerifyLog(log.id)} style={{ padding: '4px 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Verify Integrity</button>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#6b7280' }}>No audit logs found.</td>
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
