import { useState } from 'react';
import Pagination from './Pagination';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * Shared Accounts table.
 * Used by: Teller (account directory), BranchManager (account directory)
 *
 * @param {Array} accounts — Account entries
 */
const AccountsTable = ({ accounts }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const paginatedAccounts = accounts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="logs-table-container">
      <div className="table-header">
        <h3>{t('dashboard.customerAccountsDir')}</h3>
      </div>
      <table className="logs-table">
        <thead>
          <tr>
            <th>{t('dashboard.accountNumber')}</th>
            <th>{t('dashboard.ownerId')}</th>
            <th>{t('dashboard.balance')}</th>
          </tr>
        </thead>
        <tbody>
          {paginatedAccounts.map((acc) => (
            <tr key={acc.id}>
              <td>
                <strong>{acc.accountNumber}</strong>
              </td>
              <td>{acc.user?.id}</td>
              <td>₹{acc.balance}</td>
            </tr>
          ))}
          {accounts.length === 0 && (
            <tr>
              <td colSpan="3" className="empty-table">
                {t('dashboard.noAccounts')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Pagination
        currentPage={page}
        totalItems={accounts.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setPage}
      />
    </div>
  );
};

export default AccountsTable;
