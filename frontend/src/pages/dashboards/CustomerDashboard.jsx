import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Building } from 'lucide-react';
import DashboardShell from '../../components/shared/DashboardShell';
import Pagination from '../../components/shared/Pagination';
import useAuth from '../../hooks/useAuth';
import * as api from '../../api/client';

/**
 * Customer Dashboard
 * Shows: Account balance cards only.
 */
const CustomerDashboard = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    api.fetchAccounts(token)
      .then(setAccounts)
      .catch((err) => console.error('Failed to load accounts:', err));
  }, [token]);

  const paginatedAccounts = accounts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <DashboardShell>
      <div className="customer-view">
        <h2 className="section-title">
          <Building size={24} className="icon-blue" /> Your Accounts
        </h2>
        <div className="card-grid">
          {paginatedAccounts.map((acc) => (
            <div key={acc.id} className="balance-card">
              <div className="card-header">
                <h3>Account Summary</h3>
                <span className="account-number">#{acc.accountNumber}</span>
              </div>
              <div className="balance-amount">
                <span className="currency">₹</span>
                {acc.balance}
              </div>
              <div className="card-footer">Available Balance</div>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="empty-state">No accounts found.</div>
          )}
        </div>
        <Pagination
          currentPage={page}
          totalItems={accounts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
        />
      </div>
    </DashboardShell>
  );
};

export default CustomerDashboard;
