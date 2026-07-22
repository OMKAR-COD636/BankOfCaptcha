import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Users } from 'lucide-react';
import DashboardShell from '../../components/shared/DashboardShell';
import AccountsTable from '../../components/shared/AccountsTable';
import Pagination from '../../components/shared/Pagination';
import useAuth from '../../hooks/useAuth';
import * as api from '../../api/client';

/**
 * Teller Dashboard
 * Shows: Account directory, Transfer portal, KYC queue
 */
const TellerDashboard = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [transferForm, setTransferForm] = useState({ source: '', dest: '', amount: '' });
  const [transferMsg, setTransferMsg] = useState('');
  const [kycPage, setKycPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    api.fetchAccounts(token).then(setAccounts).catch(console.error);
    api.fetchKycQueue(token).then(setKycRequests).catch(console.error);
  }, [token]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferMsg('');
    try {
      const text = await api.submitTransfer(token, {
        sourceAccountNumber: transferForm.source,
        destAccountNumber: transferForm.dest,
        amount: transferForm.amount,
      });
      setTransferMsg(text);
      setTransferForm({ source: '', dest: '', amount: '' });
      api.fetchAccounts(token).then(setAccounts);
    } catch (err) {
      setTransferMsg(err.message || 'Transfer failed.');
    }
  };

  const handleApproveKyc = async (id) => {
    try {
      const data = await api.approveKyc(token, id);
      alert(data.message + (data.accountNumber ? ` (Acc: ${data.accountNumber})` : ''));
      setKycRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert('Failed to approve KYC');
    }
  };

  const paginatedKycReqs = kycRequests.slice(
    (kycPage - 1) * itemsPerPage,
    kycPage * itemsPerPage
  );

  return (
    <DashboardShell>
      <div className="admin-view">
        <div className="staff-intro">
          <h2 className="section-title">
            <Users size={24} className="icon-blue" /> {t('dashboard.staffDashboard')}
          </h2>
        </div>

        {/* Account Directory */}
        <AccountsTable accounts={accounts} />

        {/* Transfer Portal */}
        <div className="form-card">
          <div className="table-header" style={{ padding: 0, border: 'none', background: 'transparent', marginBottom: '15px' }}>
            <h3>{t('dashboard.tellerTransferPortal')}</h3>
          </div>
          {transferMsg && <div className="alert-message">{transferMsg}</div>}
          <form onSubmit={handleTransfer} className="form-row">
            <input
              type="text"
              placeholder={t("dashboard.sourceAccount")}
              value={transferForm.source}
              onChange={(e) => setTransferForm({ ...transferForm, source: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder={t("dashboard.destAccount")}
              value={transferForm.dest}
              onChange={(e) => setTransferForm({ ...transferForm, dest: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder={t("dashboard.amount")}
              value={transferForm.amount}
              onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
              required
            />
            <button type="submit" className="btn-primary">{t('dashboard.submitTransfer')}</button>
          </form>
        </div>

        {/* KYC Queue */}
        <div className="logs-table-container">
          <div className="table-header">
            <h3>{t('dashboard.kycQueue')}</h3>
          </div>
          <table className="logs-table">
            <thead>
              <tr>
                <th>{t('dashboard.name')}</th>
                <th>{t('dashboard.email')}</th>
                <th>{t('dashboard.aadhaarEncrypted')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedKycReqs.map((req) => (
                <tr key={req.id}>
                  <td><strong>{req.fullName}</strong></td>
                  <td>{req.email}</td>
                  <td><code style={{ fontSize: '0.8em' }}>{req.encryptedAadhaar}</code></td>
                  <td>
                    <button className="btn-success" onClick={() => handleApproveKyc(req.id)}>
                      Approve Account
                    </button>
                  </td>
                </tr>
              ))}
              {kycRequests.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-table">{t('dashboard.noPendingKyc')}</td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            currentPage={kycPage}
            totalItems={kycRequests.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setKycPage}
          />
        </div>
      </div>
    </DashboardShell>
  );
};

export default TellerDashboard;
