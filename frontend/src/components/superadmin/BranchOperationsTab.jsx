import { useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Building } from 'lucide-react';
import { useToast } from '../shared/ToastContext';
import * as api from '../../api/client';

/**
 * SuperAdmin — Branch Operations Tab
 * Shows: Create new branch form.
 */
const BranchOperationsTab = ({ branches, setBranches, token, users = [] }) => {
  const { t } = useTranslation();
  const showToast = useToast();
  const [createBranchForm, setCreateBranchForm] = useState({ name: '', location: '' });

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      const data = await api.createBranch(token, createBranchForm);
      showToast('Branch created: ' + data.branchId, 'success');
      setBranches([...branches, data]);
      setCreateBranchForm({ name: '', location: '' });
    } catch (err) {
      showToast(err.error || 'Failed to create branch', 'error');
    }
  };

  return (
    <div className="admin-tab-content animated-fade-in">
      <h2 className="section-title">
        <Building size={24} className="icon-blue" /> {t('dashboard.createNewBranch')}
      </h2>
      <div className="form-card">
        <form onSubmit={handleCreateBranch} className="form-row">
          <input
            type="text"
            placeholder={t("dashboard.branchNamePlaceholder")}
            value={createBranchForm.name}
            onChange={(e) => setCreateBranchForm({ ...createBranchForm, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder={t("dashboard.branchLocationPlaceholder")}
            value={createBranchForm.location}
            onChange={(e) => setCreateBranchForm({ ...createBranchForm, location: e.target.value })}
            required
          />
          <button type="submit" className="btn-success" style={{ padding: '8px 16px' }}>
            Create Branch
          </button>
        </form>
      </div>

      <h2 className="section-title" style={{ marginTop: '2rem' }}>
        <Building size={24} className="icon-blue" /> {t('dashboard.existingBranches')}
      </h2>
      <div className="logs-table-container">
        <table className="sa-branch-table">
          <thead>
            <tr>
              <th>{t('dashboard.branchId')}</th>
              <th>{t('dashboard.branchName')}</th>
              <th>{t('dashboard.location')}</th>
              <th>{t('dashboard.assignedStaff')}</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => {
              const staffCount = users.filter(u => u.branch && u.branch.id === b.id).length;
              return (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td><strong>{b.name}</strong></td>
                  <td>{b.location}</td>
                  <td>
                    <span className="sa-access-badge active">{staffCount} {t('dashboard.members')}</span>
                  </td>
                </tr>
              );
            })}
            {branches.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#6b7280' }}>
                  {t('dashboard.noBranchesYet')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BranchOperationsTab;
