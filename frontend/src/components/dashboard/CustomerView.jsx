import React from 'react';
import { Building } from 'lucide-react';
import Pagination from '../Pagination'; // Wait, let's just make Pagination a separate component first

const CustomerView = ({ accounts, accountPage, setAccountPage, itemsPerPage }) => {
  const paginatedAccounts = accounts.slice((accountPage - 1) * itemsPerPage, accountPage * itemsPerPage);

  return (
    <div className="customer-view">
      <h2 className="section-title"><Building size={24} className="icon-blue" /> Your Accounts</h2>
      <div className="card-grid">
        {paginatedAccounts.map(acc => (
          <div key={acc.id} className="balance-card">
            <div className="card-header">
              <h3>Account Summary</h3>
              <span className="account-number">#{acc.accountNumber}</span>
            </div>
            <div className="balance-amount">
              <span className="currency">₹</span>{acc.balance}
            </div>
            <div className="card-footer">
              Available Balance
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="empty-state">No accounts found.</div>
        )}
      </div>
      <Pagination currentPage={accountPage} totalItems={accounts.length} itemsPerPage={itemsPerPage} onPageChange={setAccountPage} />
    </div>
  );
};

export default CustomerView;
