import { useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Building } from 'lucide-react';
import * as api from '../../api/client';

/**
 * SuperAdmin — Branch Operations Tab
 * Shows: Create new branch form.
 */
const BranchOperationsTab = ({ branches, setBranches, token }) => {
  const { t } = useTranslation();
  const [createBranchForm, setCreateBranchForm] = useState({ name: '', location: '' });

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      const data = await api.createBranch(token, createBranchForm);
      alert('Branch created: ' + data.branchId);
      setBranches([...branches, data]);
      setCreateBranchForm({ name: '', location: '' });
    } catch (err) {
      alert(err.error || 'Failed to create branch');
    }
  };

  return (
    <div className="admin-tab-content animated-fade-in">
      <h2 className="section-title">
        <Building size={24} className="icon-blue" /> Create New Branch
      </h2>
      <div className="form-card">
        <form onSubmit={handleCreateBranch} className="form-row">
          <input
            type="text"
            placeholder="Branch Name (e.g. South End)"
            value={createBranchForm.name}
            onChange={(e) => setCreateBranchForm({ ...createBranchForm, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Location (e.g. Mumbai)"
            value={createBranchForm.location}
            onChange={(e) => setCreateBranchForm({ ...createBranchForm, location: e.target.value })}
            required
          />
          <button type="submit" className="btn-success" style={{ padding: '8px 16px' }}>
            Create Branch
          </button>
        </form>
      </div>
    </div>
  );
};

export default BranchOperationsTab;
