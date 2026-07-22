import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import Pagination from '../Pagination';

const ManagerTab = ({
  transactionRequests,
  handleApprove,
  handleReject,
  itemsPerPage
}) => {
  const [txReqPage, setTxReqPage] = useState(1);
  const paginatedTxReqs = transactionRequests.slice((txReqPage - 1) * itemsPerPage, txReqPage * itemsPerPage);

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
    </div>
  );
};

export default ManagerTab;
