import React from 'react';
import { Building } from 'lucide-react';

const BranchTab = ({
  createBranchForm,
  setCreateBranchForm,
  handleCreateBranch,
  branches
}) => {
  return (
    <div className="admin-tab-content animated-fade-in">
      <h2 className="section-title"><Building size={24} className="icon-blue" /> Branch Management</h2>
      <div className="card mb-4" style={{ padding: '20px', background: 'white', borderRadius: '8px' }}>
        <form onSubmit={handleCreateBranch} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input type="text" placeholder="Branch Name" value={createBranchForm.name} onChange={e => setCreateBranchForm({...createBranchForm, name: e.target.value})} required style={{ padding: '8px', flex: 1 }} />
          <input type="text" placeholder="Location" value={createBranchForm.location} onChange={e => setCreateBranchForm({...createBranchForm, location: e.target.value})} required style={{ padding: '8px', flex: 1 }} />
          <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Create Branch</button>
        </form>
      </div>

      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Branch Name</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {branches.map(b => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td><strong>{b.name}</strong></td>
                <td>{b.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BranchTab;
