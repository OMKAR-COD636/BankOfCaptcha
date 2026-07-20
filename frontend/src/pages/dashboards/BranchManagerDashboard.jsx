import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import DashboardShell from '../../components/shared/DashboardShell';
import AccountsTable from '../../components/shared/AccountsTable';
import Pagination from '../../components/shared/Pagination';
import useAuth from '../../hooks/useAuth';
import * as api from '../../api/client';

/**
 * Branch Manager Dashboard
 * Shows: Account directory, Pending transfer requests (Maker-Checker)
 */
const BranchManagerDashboard = () => {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactionRequests, setTransactionRequests] = useState([]);
  const [txReqPage, setTxReqPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    api.fetchAccounts(token).then(setAccounts).catch(console.error);
    api.fetchTransactionRequests(token).then(setTransactionRequests).catch(console.error);
  }, [token]);

  const handleApprove = async (id) => {
    try {
      const text = await api.approveTransaction(token, id);
      alert(text);
      setTransactionRequests((prev) => prev.filter((req) => req.id !== id));
      api.fetchAccounts(token).then(setAccounts);
    } catch {
      alert('Approval failed');
    }
  };

  const handleReject = async (id) => {
    try {
      const text = await api.rejectTransaction(token, id);
      alert(text);
      setTransactionRequests((prev) => prev.filter((req) => req.id !== id));
      api.fetchAccounts(token).then(setAccounts);
    } catch {
      alert('Rejection failed');
    }
  };

  const paginatedTxReqs = transactionRequests.slice(
    (txReqPage - 1) * itemsPerPage,
    txReqPage * itemsPerPage
  );

  return (
    <DashboardShell>
      <div className="admin-view">
        <div className="staff-intro">
          <h2 className="section-title">
            <Users size={24} className="icon-blue" /> Staff Dashboard
          </h2>
        </div>

        {/* Account Directory */}
        <AccountsTable accounts={accounts} />

        {/* Transfer Requests Queue */}
        <div className="logs-table-container">
          <div className="table-header">
            <h3>Pending Transfer Requests Queue (Maker-Checker)</h3>
          </div>
          <table className="logs-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Initiator</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTxReqs.map((req) => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td>{req.initiator?.username}</td>
                  <td>{req.sourceAccount?.accountNumber}</td>
                  <td>{req.destAccount?.accountNumber}</td>
                  <td>₹{req.amount}</td>
                  <td>
                    <button className="btn-success" onClick={() => handleApprove(req.id)} style={{ marginRight: '5px' }}>
                      Approve
                    </button>
                    <button className="btn-danger" onClick={() => handleReject(req.id)}>
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
              {transactionRequests.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-table">No pending requests.</td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            currentPage={txReqPage}
            totalItems={transactionRequests.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setTxReqPage}
          />
        </div>
      </div>
    </DashboardShell>
  );
};

export default BranchManagerDashboard;
