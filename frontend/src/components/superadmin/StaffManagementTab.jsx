import { useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Users } from 'lucide-react';
import * as api from '../../api/client';

/**
 * SuperAdmin — Staff Management Tab
 * Shows: Create staff form, Assign staff to branch form.
 */
const StaffManagementTab = ({ users, branches, token }) => {
  const { t } = useTranslation();
  const [createStaffForm, setCreateStaffForm] = useState({
    username: '', password: '', role: 'ROLE_TELLER', branchId: '',
  });
  const [assignForm, setAssignForm] = useState({ userId: '', branchId: '' });

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const data = await api.createStaff(token, createStaffForm);
      alert(data.message);
      setCreateStaffForm({ username: '', password: '', role: 'ROLE_TELLER', branchId: '' });
    } catch (err) {
      alert(err.error || 'Failed to create staff');
    }
  };

  const handleAssignStaff = async (e) => {
    e.preventDefault();
    try {
      const data = await api.assignStaffToBranch(token, assignForm.branchId, assignForm.userId);
      alert(data.message);
    } catch (err) {
      alert(err.error || 'Failed to assign staff');
    }
  };

  return (
    <div className="admin-tab-content animated-fade-in">
      <h2 className="section-title">
        <Users size={24} className="icon-blue" /> {t('dashboard.createNewStaff')}
      </h2>
      <div className="form-card">
        <form onSubmit={handleCreateStaff} className="form-row">
          <input
            type="text"
            placeholder={t("dashboard.username")}
            value={createStaffForm.username}
            onChange={(e) => setCreateStaffForm({ ...createStaffForm, username: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder={t("dashboard.password")}
            value={createStaffForm.password}
            onChange={(e) => setCreateStaffForm({ ...createStaffForm, password: e.target.value })}
            required
          />
          <select
            value={createStaffForm.role}
            onChange={(e) => setCreateStaffForm({ ...createStaffForm, role: e.target.value })}
            required
          >
            <option value="ROLE_TELLER">{t('dashboard.roleTeller')}</option>
            <option value="ROLE_BRANCH_MANAGER">{t('dashboard.roleBranchManager')}</option>
          </select>
          <select
            value={createStaffForm.branchId}
            onChange={(e) => setCreateStaffForm({ ...createStaffForm, branchId: e.target.value })}
            required
          >
            <option value="">{t('dashboard.selectBranch')}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
            ))}
          </select>
          <button type="submit" className="btn-primary">{t('dashboard.createStaffBtn')}</button>
        </form>
      </div>

      <h2 className="section-title">
        <Users size={24} className="icon-blue" /> {t('dashboard.assignStaff')}
      </h2>
      <div className="form-card">
        <form onSubmit={handleAssignStaff} className="form-row">
          <select
            value={assignForm.userId}
            onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
            required
          >
            <option value="">{t('dashboard.selectStaffMember')}</option>
            {users.filter((u) => u.role !== 'ROLE_CUSTOMER').map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({u.role.replace('ROLE_', '')}) - Branch: {u.branch?.name || 'None'}
              </option>
            ))}
          </select>
          <select
            value={assignForm.branchId}
            onChange={(e) => setAssignForm({ ...assignForm, branchId: e.target.value })}
            required
          >
            <option value="">{t('dashboard.selectBranch')}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
            ))}
          </select>
          <button type="submit" className="btn-primary">{t('dashboard.assignStaffBtn')}</button>
        </form>
      </div>
    </div>
  );
};

export default StaffManagementTab;
