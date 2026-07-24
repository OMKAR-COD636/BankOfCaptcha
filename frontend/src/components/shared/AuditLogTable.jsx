import { useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Search, Filter, FileText } from 'lucide-react';
import Pagination from './Pagination';
import { useToast } from './ToastContext';
import * as api from '../../api/client';

/**
 * Shared Audit Log Table with filters and integrity verification.
 * Used by: SuperAdmin (Compliance tab), Admin, ComplianceOfficer
 *
 * @param {Array} logs       — Audit log entries
 * @param {Array} users      — All users (for role lookup)
 * @param {string} token     — Auth token
 * @param {string|null} selectedDate — Optional date filter from parent
 */
const AuditLogTable = ({ logs, users, token, selectedDate = null }) => {
  const { t } = useTranslation();
  const showToast = useToast();
  const [filter, setFilter] = useState({ search: '', role: '' });
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const getUserRole = (username) =>
    users.find((u) => u.username === username)?.role?.replace('ROLE_', '') || 'UNKNOWN';

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !filter.search || log.username.toLowerCase().includes(filter.search.toLowerCase());
    const matchesRole = !filter.role || getUserRole(log.username) === filter.role;
    if (selectedDate) {
      const logDate = new Date(log.timestamp + 'Z');
      const logDateStr =
        logDate.getFullYear() +
        '-' +
        String(logDate.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(logDate.getDate()).padStart(2, '0');
      if (logDateStr !== selectedDate) return false;
    }
    return matchesSearch && matchesRole;
  });

  const paginatedLogs = filteredLogs.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const [integrityResult, setIntegrityResult] = useState(null);

  const handleVerifyLog = async (id) => {
    try {
      const data = await api.verifyLogIntegrity(token, id);
      setIntegrityResult(data);
    } catch {
      showToast('Verification failed', 'error');
    }
  };

  return (
    <div className="logs-table-container">
      <div className="table-header">
        <h3>
          <FileText size={20} className="icon-blue" /> System Audit Logs
        </h3>
      </div>

      <div className="alert-filters" style={{ margin: '15px', marginBottom: 0 }}>
        <div className="filter-group">
          <Search size={16} className="filter-icon" />
          <input
            type="text"
            placeholder="Search by username..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <select
            value={filter.role}
            onChange={(e) => setFilter({ ...filter, role: e.target.value })}
            className="filter-select"
          >
            <option value="">{t('dashboard.allRoles')}</option>
            <option value="CUSTOMER">{t('dashboard.roleCustomer')}</option>
            <option value="TELLER">{t('dashboard.roleTeller')}</option>
            <option value="BRANCH_MANAGER">{t('dashboard.roleBranchManager')}</option>
            <option value="ADMIN">{t('dashboard.roleAdmin')}</option>
            <option value="SUPER_ADMIN">{t('dashboard.roleSuperAdmin')}</option>
            <option value="COMPLIANCE_OFFICER">{t('dashboard.roleComplianceOfficer')}</option>
          </select>
        </div>
      </div>

      <table className="logs-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>{t('dashboard.userRole')}</th>
            <th>{t('dashboard.action')}</th>
            <th>{t('dashboard.timestamp')}</th>
            <th>{t('dashboard.verify')}</th>
          </tr>
        </thead>
        <tbody>
          {paginatedLogs.map((log) => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>
                <span className="log-user">{log.username}</span>
              </td>
              <td>
                <span className="role-badge">{getUserRole(log.username)}</span>
              </td>
              <td>
                <code>{log.action}</code>
              </td>
              <td>{new Date(log.timestamp + 'Z').toLocaleString()}</td>
              <td>
                <button
                  className="verify-btn"
                  onClick={() => handleVerifyLog(log.id)}
                >
                  Verify Integrity
                </button>
              </td>
            </tr>
          ))}
          {filteredLogs.length === 0 && (
            <tr>
              <td colSpan="6" className="empty-table">
                {t('dashboard.noAuditLogs')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Pagination
        currentPage={page}
        totalItems={filteredLogs.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setPage}
      />

      {integrityResult && (
        <div className="sa-integrity-overlay" onClick={() => setIntegrityResult(null)}>
          <div className="sa-integrity-modal" onClick={e => e.stopPropagation()}>
            <div className="sa-integrity-icon-area">
              <div className={`sa-integrity-icon-circle ${integrityResult.valid ? 'valid' : 'invalid'}`}>
                {integrityResult.valid ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                )}
              </div>
              <h3 className="sa-integrity-title">
                {integrityResult.valid ? 'Integrity Verified' : 'Integrity Compromised'}
              </h3>
              <p className="sa-integrity-subtitle">
                {integrityResult.valid 
                  ? 'Cryptographic signature matches the original state.'
                  : integrityResult.message || 'The log has been tampered with or signature is invalid.'}
              </p>
            </div>
            <div className="sa-integrity-details">
              <div className="sa-integrity-row">
                <span className="sa-integrity-row-label">Signature Algorithm</span>
                <span className="sa-integrity-row-value">{integrityResult.signatureAlgorithm || 'N/A'}</span>
              </div>
              <div className="sa-integrity-row">
                <span className="sa-integrity-row-label">Encryption</span>
                <span className="sa-integrity-row-value">{integrityResult.encryptionAlgorithm || 'N/A'}</span>
              </div>
            </div>
            <div className="sa-integrity-footer">
              <button 
                className={`sa-integrity-close-btn ${integrityResult.valid ? 'valid' : 'invalid'}`}
                onClick={() => setIntegrityResult(null)}
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogTable;
