import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, ShieldAlert, AlertTriangle, Building, FileText, Users, Search, Filter, Activity } from 'lucide-react';
import logoUrl from '../assets/logo.svg';
import './Dashboard.css';
import RiskActivityGraph from '../components/RiskActivityGraph';
import RiskHeatmap from '../components/RiskHeatmap';
import AlertReviewModal from '../components/AlertReviewModal';

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;
  return (
    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px', marginBottom: '15px' }}>
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        style={{ padding: '5px 10px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', background: 'var(--card-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
      >
        Previous
      </button>
      <span style={{ padding: '5px', fontSize: '14px', color: 'var(--text-light)' }}>Page {currentPage} of {totalPages}</span>
      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        style={{ padding: '5px 10px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', background: 'var(--card-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
      >
        Next
      </button>
    </div>
  );
};
const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [aiAlerts, setAiAlerts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactionRequests, setTransactionRequests] = useState([]);
  const [transferForm, setTransferForm] = useState({ source: '', dest: '', amount: '' });
  const [transferMsg, setTransferMsg] = useState('');
  const [kycRequests, setKycRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [assignForm, setAssignForm] = useState({ userId: '', branchId: '' });
  const [createBranchForm, setCreateBranchForm] = useState({ name: '', location: '' });
  const [createStaffForm, setCreateStaffForm] = useState({ username: '', password: '', role: 'ROLE_TELLER', branchId: '' });
  
  const [alertFilter, setAlertFilter] = useState({ search: '', severity: '', status: '', role: '' });
  const [logFilter, setLogFilter] = useState({ search: '', role: '' });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMatrix, setSelectedMatrix] = useState(null);
  const [selectedAlertForReview, setSelectedAlertForReview] = useState(null);
  const [activeAdminTab, setActiveAdminTab] = useState('security');
  
  const [alertPage, setAlertPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [txReqPage, setTxReqPage] = useState(1);
  const [kycReqPage, setKycReqPage] = useState(1);
  const [accountPage, setAccountPage] = useState(1);
  const itemsPerPage = 20;
  
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (role === 'ROLE_SUPER_ADMIN' || role === 'ROLE_ADMIN' || role === 'ROLE_COMPLIANCE_OFFICER') {
      fetch('http://localhost:8080/api/audit/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => console.error(err));

      fetch('http://localhost:8080/api/branches/users', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));

      if (role === 'ROLE_SUPER_ADMIN') {
        fetch('http://localhost:8080/api/ai/alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setAiAlerts(data))
        .catch(err => console.error(err));

        fetch('http://localhost:8080/api/branches', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setBranches(data))
        .catch(err => console.error(err));
      }
    }

    if (role === 'ROLE_TELLER') {
      fetch('http://localhost:8080/api/kyc/queue', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setKycRequests(data))
      .catch(err => console.error(err));
    }

    if (role === 'ROLE_CUSTOMER' || role === 'ROLE_TELLER' || role === 'ROLE_BRANCH_MANAGER') {
      fetch('http://localhost:8080/api/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setAccounts(data))
      .catch(err => console.error(err));
    }

    if (role === 'ROLE_BRANCH_MANAGER') {
      fetch('http://localhost:8080/api/transactions/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setTransactionRequests(data))
      .catch(err => console.error(err));
    }
  }, [token, role, navigate]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferMsg('');
    try {
      const res = await fetch('http://localhost:8080/api/transactions/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          sourceAccountNumber: transferForm.source,
          destAccountNumber: transferForm.dest,
          amount: transferForm.amount
        })
      });
      const text = await res.text();
      setTransferMsg(text);
      if (res.ok) {
        setTransferForm({ source: '', dest: '', amount: '' });
        fetch('http://localhost:8080/api/accounts', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.json())
          .then(data => setAccounts(data));
      }
    } catch (err) {
      setTransferMsg("Transfer failed.");
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/api/transactions/requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const text = await res.text();
      alert(text);
      setTransactionRequests(prev => prev.filter(req => req.id !== id));
      fetch('http://localhost:8080/api/accounts', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setAccounts(data));
    } catch (err) {
      alert("Approval failed");
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/api/transactions/requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const text = await res.text();
      alert(text);
      setTransactionRequests(prev => prev.filter(req => req.id !== id));
      fetch('http://localhost:8080/api/accounts', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setAccounts(data));
    } catch (err) {
      alert("Rejection failed");
    }
  };

  const handleVerifyLog = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/api/audit/logs/${id}/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.valid) {
         alert(`Integrity Verified! \nSignature: ${data.signatureAlgorithm}\nEncryption: ${data.encryptionAlgorithm}`);
      } else {
         alert(`INTEGRITY COMPROMISED!\nReason: ${data.message}`);
      }
    } catch (err) {
      alert("Verification failed");
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/api/admin/alerts/${id}/release`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        // Update local state to reflect RESOLVED status
        setAiAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'RESOLVED' } : a));
      } else {
        alert(data.error || "Failed to resolve alert.");
      }
    } catch (err) {
      alert("Failed to resolve alert.");
    }
  };

  const handleResolveAllAlerts = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/admin/alerts/resolve-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        // Update all alerts in local state to RESOLVED
        setAiAlerts(prev => prev.map(a => ({ ...a, status: 'RESOLVED' })));
      } else {
        alert(data.error || "Failed to resolve all alerts.");
      }
    } catch (err) {
      alert("Failed to resolve all alerts.");
    }
  };

  const handleApproveKyc = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/api/kyc/${id}/approve`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      alert(data.message + (data.accountNumber ? ` (Acc: ${data.accountNumber})` : ''));
      setKycRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) { alert('Failed to approve KYC'); }
  };

  const handleAssignStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8080/api/branches/${assignForm.branchId}/assign/${assignForm.userId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) alert(data.message);
      else alert(data.error);
    } catch (err) { alert('Failed to assign staff'); }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8080/api/branches`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(createBranchForm)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Branch created: " + data.branchId);
        setBranches([...branches, data]);
        setCreateBranchForm({ name: '', location: '' });
      } else { alert(data.error); }
    } catch (err) { alert('Failed to create branch'); }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8080/api/admin/staff`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(createStaffForm)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setCreateStaffForm({ username: '', password: '', role: 'ROLE_TELLER', branchId: '' });
        // Optionally refresh users
      } else { alert(data.error); }
    } catch (err) { alert('Failed to create staff'); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Pre-compute filtered lists for summary cards and tables
  const filteredAlerts = aiAlerts.filter(a => {
    const matchesSearch = !alertFilter.search || a.flaggedUsername.toLowerCase().includes(alertFilter.search.toLowerCase());
    const userRole = users.find(u => u.username === a.flaggedUsername)?.role?.replace('ROLE_', '') || 'UNKNOWN';
    const matchesRole = !alertFilter.role || userRole === alertFilter.role;
    const matchesSeverity = !alertFilter.severity || a.severity === alertFilter.severity;
    const matchesStatus = !alertFilter.status || a.status === alertFilter.status;
    const alertDate = new Date(a.timestamp);
    const alertDateStr = alertDate.getFullYear() + '-' + String(alertDate.getMonth() + 1).padStart(2, '0') + '-' + String(alertDate.getDate()).padStart(2, '0');
    const matchesDate = !selectedDate || (alertDateStr === selectedDate);
    const matchesMatrix = !selectedMatrix || a.severity === selectedMatrix.severity;
    return matchesSearch && matchesRole && matchesSeverity && matchesStatus && matchesDate && matchesMatrix;
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !logFilter.search || log.username.toLowerCase().includes(logFilter.search.toLowerCase());
    const userRole = users.find(u => u.username === log.username)?.role?.replace('ROLE_', '') || 'UNKNOWN';
    const matchesRole = !logFilter.role || userRole === logFilter.role;
    const logDate = new Date(log.timestamp);
    const logDateStr = logDate.getFullYear() + '-' + String(logDate.getMonth() + 1).padStart(2, '0') + '-' + String(logDate.getDate()).padStart(2, '0');
    const matchesDate = !selectedDate || (logDateStr === selectedDate);
    return matchesSearch && matchesRole && matchesDate;
  });

  const filteredTransactionRequests = transactionRequests.filter(req => {
    // Assuming req has a timestamp or similar, if not we'll just return true.
    // If request has no timestamp, we won't filter by date.
    return true; // We'll update this if timestamp exists.
  });

  const paginatedAlerts = filteredAlerts.slice((alertPage - 1) * itemsPerPage, alertPage * itemsPerPage);
  const paginatedLogs = filteredLogs.slice((logPage - 1) * itemsPerPage, logPage * itemsPerPage);
  const paginatedTxReqs = transactionRequests.slice((txReqPage - 1) * itemsPerPage, txReqPage * itemsPerPage);
  const paginatedKycReqs = kycRequests.slice((kycReqPage - 1) * itemsPerPage, kycReqPage * itemsPerPage);
  const paginatedAccounts = accounts.slice((accountPage - 1) * itemsPerPage, accountPage * itemsPerPage);

  return (
    <div className="dashboard-container">
      {selectedAlertForReview && (
        <AlertReviewModal alert={selectedAlertForReview} token={token} onClose={() => setSelectedAlertForReview(null)} />
      )}
      <nav className="navbar">
        <div className="nav-brand">
          <img src={logoUrl} alt="Bank Of Captcha Logo" width="28" height="28" />
          <span>BANK OF CAPTCHA</span>
        </div>
        <div className="nav-user">
          <User size={20} />
          <span className="user-info">{username} <span className="role-badge">{role.replace('ROLE_', '')}</span></span>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </nav>

      <div className="hero-banner">
        <div className="container">
          <h1>Welcome, {username}</h1>
          <p>Official Government Banking Portal</p>
        </div>
      </div>

      <main className="dashboard-main container">
        {role === 'ROLE_CUSTOMER' ? (
          <div className="customer-view">
            <h2 className="section-title"><Building size={24} className="icon-blue" /> Your Accounts</h2>
            <div className="card-grid">
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
          </div>
        ) : role === 'ROLE_SUPER_ADMIN' ? (
          <div className="admin-view">
            <div className="admin-tabs">
              <button className={`admin-tab ${activeAdminTab === 'security' ? 'active' : ''}`} onClick={() => setActiveAdminTab('security')}>
                Security & Intelligence
              </button>
              <button className={`admin-tab ${activeAdminTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveAdminTab('staff')}>
                Staff Management
              </button>
              <button className={`admin-tab ${activeAdminTab === 'branch' ? 'active' : ''}`} onClick={() => setActiveAdminTab('branch')}>
                Branch Operations
              </button>
              <button className={`admin-tab ${activeAdminTab === 'compliance' ? 'active' : ''}`} onClick={() => setActiveAdminTab('compliance')}>
                Compliance & Audit
              </button>
            </div>

            {activeAdminTab === 'security' && (
              <div className="admin-tab-content animated-fade-in">
                <div className="risk-intelligence-center" style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
              <RiskActivityGraph 
                alerts={aiAlerts} 
                onDateSelect={setSelectedDate} 
                selectedDate={selectedDate} 
              />
              <RiskHeatmap 
                alerts={aiAlerts} 
                onMatrixSelect={setSelectedMatrix} 
                selectedMatrix={selectedMatrix} 
              />
            </div>

            <div className="summary-cards-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
              <div className="summary-card" style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--card-border)', boxShadow: '0 4px 6px -1px var(--shadow-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <AlertTriangle size={20} className="icon-yellow" />
                  <h3 style={{ margin: 0, color: 'var(--text-light)', fontSize: '1rem' }}>Filtered Alerts</h3>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{filteredAlerts.length}</div>
              </div>
              <div className="summary-card" style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--card-border)', boxShadow: '0 4px 6px -1px var(--shadow-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <FileText size={20} className="icon-blue" />
                  <h3 style={{ margin: 0, color: 'var(--text-light)', fontSize: '1rem' }}>Filtered Audit Logs</h3>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{filteredLogs.length}</div>
              </div>
              <div className="summary-card" style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--card-border)', boxShadow: '0 4px 6px -1px var(--shadow-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <Activity size={20} className="icon-blue" />
                  <h3 style={{ margin: 0, color: 'var(--text-light)', fontSize: '1rem' }}>Pending Requests</h3>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{transactionRequests.length}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}><AlertTriangle size={24} className="icon-yellow" /> AI Security Alerts</h2>
              <button onClick={handleResolveAllAlerts} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Resolve & Unfreeze All
              </button>
            </div>
            
            <div className="alert-filters">
              <div className="filter-group">
                <Search size={16} className="filter-icon" />
                <input type="text" placeholder="Search by username..." value={alertFilter.search} onChange={e => setAlertFilter({...alertFilter, search: e.target.value})} className="filter-input" />
              </div>
              <div className="filter-group">
                <Filter size={16} className="filter-icon" />
                <select value={alertFilter.role} onChange={e => setAlertFilter({...alertFilter, role: e.target.value})} className="filter-select">
                  <option value="">All Roles</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="TELLER">Teller</option>
                  <option value="BRANCH_MANAGER">Branch Manager</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
                </select>
              </div>
              <div className="filter-group">
                <Filter size={16} className="filter-icon" />
                <select value={alertFilter.severity} onChange={e => setAlertFilter({...alertFilter, severity: e.target.value})} className="filter-select">
                  <option value="">All Severities</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="filter-group">
                <Filter size={16} className="filter-icon" />
                <select value={alertFilter.status} onChange={e => setAlertFilter({...alertFilter, status: e.target.value})} className="filter-select">
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>

            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Flagged User</th>
                    <th>User Role</th>
                    <th>Severity</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAlerts.map(alert => (
                    <tr key={alert.id} className={alert.severity === 'HIGH' ? 'row-danger' : ''}>
                      <td>{alert.id}</td>
                      <td><strong>{alert.flaggedUsername}</strong></td>
                      <td><span className="role-badge">{users.find(u => u.username === alert.flaggedUsername)?.role?.replace('ROLE_', '') || 'UNKNOWN'}</span></td>
                      <td><span className={`severity-badge ${alert.severity.toLowerCase()}`}>{alert.severity}</span></td>
                      <td>{alert.description}</td>
                      <td><strong>{alert.status}</strong></td>
                      <td>{new Date(alert.timestamp).toLocaleString()}</td>
                      <td>
                        {alert.status === 'OPEN' && (
                           <button onClick={() => handleResolveAlert(alert.id)} style={{ padding: '4px 8px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Resolve</button>
                        )}
                        <button onClick={() => setSelectedAlertForReview(alert)} style={{ padding: '4px 8px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Review</button>
                      </td>
                    </tr>
                  ))}
                  {filteredAlerts.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: '#6b7280' }}>No alerts found matching the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination currentPage={alertPage} totalItems={filteredAlerts.length} itemsPerPage={itemsPerPage} onPageChange={setAlertPage} />
            </div>

              </div>
            )}

            {activeAdminTab === 'staff' && (
              <div className="admin-tab-content animated-fade-in">
                <h2 className="section-title"><Users size={24} className="icon-blue" /> Create New Staff</h2>
                <div className="card mb-4" style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '8px' }}>
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
                    <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create Staff</button>
                  </form>
                </div>

                <h2 className="section-title"><Users size={24} className="icon-blue" /> Assign Staff to Branch</h2>
                <div className="card mb-4" style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '8px' }}>
                  <form onSubmit={handleAssignStaff} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <select value={assignForm.userId} onChange={e => setAssignForm({...assignForm, userId: e.target.value})} required style={{ padding: '8px', flex: 1 }}>
                      <option value="">Select Staff Member</option>
                      {users.filter(u => u.role !== 'ROLE_CUSTOMER').map(u => (
                        <option key={u.id} value={u.id}>{u.username} ({u.role.replace('ROLE_', '')}) - Branch: {u.branch?.name || 'None'}</option>
                      ))}
                    </select>
                    <select value={assignForm.branchId} onChange={e => setAssignForm({...assignForm, branchId: e.target.value})} required style={{ padding: '8px', flex: 1 }}>
                      <option value="">Select Branch</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                      ))}
                    </select>
                    <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Assign Staff</button>
                  </form>
                </div>
              </div>
            )}

            {activeAdminTab === 'branch' && (
              <div className="admin-tab-content animated-fade-in">
                <h2 className="section-title"><Building size={24} className="icon-blue" /> Create New Branch</h2>
                <div className="card mb-4" style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '8px' }}>
                  <form onSubmit={handleCreateBranch} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <input type="text" placeholder="Branch Name (e.g. South End)" value={createBranchForm.name} onChange={e => setCreateBranchForm({...createBranchForm, name: e.target.value})} required style={{ padding: '8px', flex: 1 }} />
                    <input type="text" placeholder="Location (e.g. Mumbai)" value={createBranchForm.location} onChange={e => setCreateBranchForm({...createBranchForm, location: e.target.value})} required style={{ padding: '8px', flex: 1 }} />
                    <button type="submit" style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create Branch</button>
                  </form>
                </div>
              </div>
            )}

            {activeAdminTab === 'compliance' && (
              <div className="admin-tab-content animated-fade-in">
                <h2 className="section-title"><ShieldAlert size={24} className="icon-blue" /> System Audit Logs</h2>
                
                <div className="alert-filters">
                  <div className="filter-group">
                    <Search size={16} className="filter-icon" />
                    <input type="text" placeholder="Search by username..." value={logFilter.search} onChange={e => setLogFilter({...logFilter, search: e.target.value})} className="filter-input" />
                  </div>
                  <div className="filter-group">
                    <Filter size={16} className="filter-icon" />
                    <select value={logFilter.role} onChange={e => setLogFilter({...logFilter, role: e.target.value})} className="filter-select">
                      <option value="">All Roles</option>
                      <option value="CUSTOMER">Customer</option>
                      <option value="TELLER">Teller</option>
                      <option value="BRANCH_MANAGER">Branch Manager</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
                    </select>
                  </div>
                </div>

                <div className="logs-table-container">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>User Role</th>
                        <th>Action</th>
                        <th>Timestamp</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLogs.map(log => (
                        <tr key={log.id}>
                          <td>{log.id}</td>
                          <td><span className="log-user">{log.username}</span></td>
                          <td><span className="role-badge">{users.find(u => u.username === log.username)?.role?.replace('ROLE_', '') || 'UNKNOWN'}</span></td>
                          <td><code>{log.action}</code></td>
                          <td>{new Date(log.timestamp).toLocaleString()}</td>
                          <td>
                            <button className="verify-btn" onClick={() => handleVerifyLog(log.id)}>Verify Integrity</button>
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan="6" className="empty-table">No audit logs found for the selected filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <Pagination currentPage={logPage} totalItems={filteredLogs.length} itemsPerPage={itemsPerPage} onPageChange={setLogPage} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="admin-view">
            <div className="staff-intro">
              <h2 className="section-title"><Users size={24} className="icon-blue" /> Staff Dashboard</h2>
            </div>
            
            {role === 'ROLE_TELLER' || role === 'ROLE_BRANCH_MANAGER' ? (
              <div className="logs-table-container mb-4">
                <div className="table-header">
                  <h3>Customer Accounts Directory</h3>
                </div>
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Account Number</th>
                      <th>Owner ID</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAccounts.map(acc => (
                      <tr key={acc.id}>
                        <td><strong>{acc.accountNumber}</strong></td>
                        <td>{acc.user?.id}</td>
                        <td>₹{acc.balance}</td>
                      </tr>
                    ))}
                    {accounts.length === 0 && (
                      <tr>
                        <td colSpan="3" className="empty-table">No accounts accessible or access denied.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination currentPage={accountPage} totalItems={accounts.length} itemsPerPage={itemsPerPage} onPageChange={setAccountPage} />
              </div>
            ) : null}

            {role === 'ROLE_TELLER' && (
              <div className="transfer-portal card mb-4" style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '8px' }}>
                <div className="table-header">
                  <h3>Teller Transfer Portal</h3>
                </div>
                {transferMsg && <div className="alert-message" style={{ padding: '10px', background: '#e0f2fe', color: '#0369a1', marginBottom: '15px', borderRadius: '4px' }}>{transferMsg}</div>}
                <form onSubmit={handleTransfer} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <input type="text" placeholder="Source Account" value={transferForm.source} onChange={e => setTransferForm({...transferForm, source: e.target.value})} required style={{ padding: '8px' }} />
                  <input type="text" placeholder="Dest Account" value={transferForm.dest} onChange={e => setTransferForm({...transferForm, dest: e.target.value})} required style={{ padding: '8px' }} />
                  <input type="number" placeholder="Amount" value={transferForm.amount} onChange={e => setTransferForm({...transferForm, amount: e.target.value})} required style={{ padding: '8px' }} />
                  <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Submit Transfer</button>
                </form>
              </div>
            )}

            {role === 'ROLE_TELLER' && (
              <div className="logs-table-container mb-4">
                <div className="table-header">
                  <h3>New Account Applications (KYC Queue)</h3>
                </div>
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Aadhaar (Encrypted)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedKycReqs.map(req => (
                      <tr key={req.id}>
                        <td><strong>{req.fullName}</strong></td>
                        <td>{req.email}</td>
                        <td><code style={{fontSize: '0.8em'}}>{req.encryptedAadhaar}</code></td>
                        <td>
                          <button onClick={() => handleApproveKyc(req.id)} style={{ padding: '4px 8px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve Account</button>
                        </td>
                      </tr>
                    ))}
                    {kycRequests.length === 0 && (
                      <tr>
                        <td colSpan="4" className="empty-table">No pending KYC applications.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination currentPage={kycReqPage} totalItems={kycRequests.length} itemsPerPage={itemsPerPage} onPageChange={setKycReqPage} />
              </div>
            )}

            {role === 'ROLE_BRANCH_MANAGER' && (
              <div className="logs-table-container mb-4">
                <div className="table-header">
                  <h3>Pending Transfer Requests Queue (Maker-Checker)</h3>
                </div>
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Initiator</th>
                      <th>Source</th>
                      <th>Destination</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTxReqs.map(req => (
                      <tr key={req.id}>
                        <td>{req.id}</td>
                        <td>{req.initiator?.username}</td>
                        <td>{req.sourceAccount?.accountNumber}</td>
                        <td>{req.destAccount?.accountNumber}</td>
                        <td>₹{req.amount}</td>
                        <td>
                          <button onClick={() => handleApprove(req.id)} style={{ padding: '4px 8px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Approve</button>
                          <button onClick={() => handleReject(req.id)} style={{ padding: '4px 8px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                        </td>
                      </tr>
                    ))}
                    {transactionRequests.length === 0 && (
                      <tr>
                        <td colSpan="6" className="empty-table">No pending requests.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination currentPage={txReqPage} totalItems={transactionRequests.length} itemsPerPage={itemsPerPage} onPageChange={setTxReqPage} />
              </div>
            )}
            
            {(role === 'ROLE_COMPLIANCE_OFFICER' || role === 'ROLE_ADMIN') && (
              <div className="logs-table-container">
                <div className="table-header">
                  <h3><FileText size={20} className="icon-blue" /> System Audit Logs</h3>
                </div>

                <div className="alert-filters" style={{ marginBottom: '15px' }}>
                  <div className="filter-group">
                    <Search size={16} className="filter-icon" />
                    <input type="text" placeholder="Search by username..." value={logFilter.search} onChange={e => setLogFilter({...logFilter, search: e.target.value})} className="filter-input" />
                  </div>
                  <div className="filter-group">
                    <Filter size={16} className="filter-icon" />
                    <select value={logFilter.role} onChange={e => setLogFilter({...logFilter, role: e.target.value})} className="filter-select">
                      <option value="">All Roles</option>
                      <option value="CUSTOMER">Customer</option>
                      <option value="TELLER">Teller</option>
                      <option value="BRANCH_MANAGER">Branch Manager</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
                    </select>
                  </div>
                </div>

                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>User Role</th>
                      <th>Action</th>
                      <th>Timestamp</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map(log => (
                      <tr key={log.id}>
                        <td>{log.id}</td>
                        <td><span className="log-user">{log.username}</span></td>
                        <td><span className="role-badge">{users.find(u => u.username === log.username)?.role?.replace('ROLE_', '') || 'UNKNOWN'}</span></td>
                        <td><code>{log.action}</code></td>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>
                          <button className="verify-btn" onClick={() => handleVerifyLog(log.id)}>Verify Integrity</button>
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan="6" className="empty-table">No audit logs found for the selected filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination currentPage={logPage} totalItems={filteredLogs.length} itemsPerPage={itemsPerPage} onPageChange={setLogPage} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
