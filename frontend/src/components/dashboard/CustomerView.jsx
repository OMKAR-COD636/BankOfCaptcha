import React from 'react';
import { Building } from 'lucide-react';
import Pagination from '../Pagination'; // Wait, let's just make Pagination a separate component first

const CustomerView = ({ accounts, accountPage, setAccountPage, itemsPerPage, transferForm, setTransferForm, handleTransfer, transferMsg }) => {
  const paginatedAccounts = accounts.slice((accountPage - 1) * itemsPerPage, accountPage * itemsPerPage);

  return (
    <div className="customer-view">
      <h2 className="section-title"><Building size={24} className="icon-blue" /> Your Accounts</h2>
      <div className="card-grid mb-4">
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

      <h2 className="section-title" style={{ marginTop: '40px' }}><Building size={24} className="icon-blue" /> Transfer Funds</h2>
      <div className="card mb-4" style={{ padding: '20px', background: 'white', borderRadius: '8px' }}>
        <form onSubmit={handleTransfer} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Source Account No" value={transferForm.source} onChange={e => setTransferForm({...transferForm, source: e.target.value})} required style={{ padding: '8px', flex: 1, minWidth: '200px' }} />
          <input type="text" placeholder="Destination Account No" value={transferForm.dest} onChange={e => setTransferForm({...transferForm, dest: e.target.value})} required style={{ padding: '8px', flex: 1, minWidth: '200px' }} />
          <input type="number" placeholder="Amount (₹)" value={transferForm.amount} onChange={e => setTransferForm({...transferForm, amount: e.target.value})} required style={{ padding: '8px', flex: 1, minWidth: '150px' }} />
          <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Initiate Transfer</button>
        </form>
        {transferMsg && <div style={{ marginTop: '15px', padding: '10px', background: '#f8fafc', borderLeft: '4px solid #3b82f6', color: '#1e293b' }}>{transferMsg}</div>}
      </div>
    </div>
  );
};

export default CustomerView;
