import React from 'react';
import { Users } from 'lucide-react';

const StaffTab = ({
  createStaffForm,
  setCreateStaffForm,
  handleCreateStaff,
  branches,
  users
}) => {
  return (
    <div className="admin-tab-content animated-fade-in">
      <h2 className="section-title"><Users size={24} className="icon-blue" /> Create New Staff</h2>
      <div className="card mb-4" style={{ padding: '20px', background: 'white', borderRadius: '8px' }}>
        <form onSubmit={handleCreateStaff} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input type="text" placeholder="Username" value={createStaffForm.username} onChange={e => setCreateStaffForm({...createStaffForm, username: e.target.value})} required style={{ padding: '8px', flex: 1 }} />
          <input type="text" placeholder="Password" value={createStaffForm.password} onChange={e => setCreateStaffForm({...createStaffForm, password: e.target.value})} required style={{ padding: '8px', flex: 1 }} />
          <select value={createStaffForm.role} onChange={e => setCreateStaffForm({...createStaffForm, role: e.target.value})} required style={{ padding: '8px', flex: 1 }}>
            <option value="ROLE_TELLER">Teller</option>
            <option value="ROLE_BRANCH_MANAGER">Branch Manager</option>
          </select>
          <select value={createStaffForm.branchId} onChange={e => setCreateStaffForm({...createStaffForm, branchId: e.target.value})} required style={{ padding: '8px', flex: 1 }}>
            <option value="">Select Branch</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
            ))}
          </select>
          <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Create User</button>
        </form>
      </div>
      
      <h2 className="section-title"><Users size={24} className="icon-blue" /> Staff Roster</h2>
      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><strong>{u.username}</strong></td>
                <td><span className="role-badge">{u.role.replace('ROLE_', '')}</span></td>
                <td>{u.branch ? `${u.branch.name} (${u.branch.location})` : 'N/A'}</td>
                <td><span className={`status-badge ${u.accessSuspended ? 'rejected' : 'approved'}`}>{u.accessSuspended ? 'Suspended' : 'Active'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffTab;
