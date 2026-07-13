import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, ShieldAlert, AlertTriangle, Building, FileText, Users } from 'lucide-react';
import logoUrl from '../assets/logo.svg';
import './Dashboard.css';

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [aiAlerts, setAiAlerts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactionRequests, setTransactionRequests] = useState([]);
  const [transferForm, setTransferForm] = useState({ source: '', dest: '', amount: '' });
  const [transferMsg, setTransferMsg] = useState('');
  
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

      if (role === 'ROLE_SUPER_ADMIN') {
        fetch('http://localhost:8080/api/ai/alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setAiAlerts(data))
        .catch(err => console.error(err));
      }
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
      if (res.ok) setTransferForm({ source: '', dest: '', amount: '' });
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
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
              {accounts.map(acc => (
                <div key={acc.id} className="balance-card">
                  <div className="card-header">
                    <h3>Account Summary</h3>
                    <span className="account-number">#{acc.accountNumber}</span>
                  </div>
                  <div className="balance-amount">
                    <span className="currency">$</span>{acc.balance}
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
          </div>
        ) : role === 'ROLE_SUPER_ADMIN' ? (
          <div className="admin-view">
            <h2 className="section-title"><AlertTriangle size={24} className="icon-yellow" /> AI Security Alerts</h2>
            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Flagged User</th>
                    <th>Severity</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {aiAlerts.map(alert => (
                    <tr key={alert.id} className={alert.severity === 'HIGH' ? 'row-danger' : ''}>
                      <td>{alert.id}</td>
                      <td><strong>{alert.flaggedUsername}</strong></td>
                      <td><span className={`severity-badge ${alert.severity.toLowerCase()}`}>{alert.severity}</span></td>
                      <td>{alert.description}</td>
                      <td><strong>{alert.status}</strong></td>
                      <td>{new Date(alert.timestamp).toLocaleString()}</td>
                      <td>
                        {alert.status === 'OPEN' && (
                           <button onClick={() => handleResolveAlert(alert.id)} style={{ padding: '4px 8px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Resolve & Unfreeze</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {aiAlerts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty-table">No AI alerts generated. System is secure.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <h2 className="section-title"><ShieldAlert size={24} className="icon-blue" /> System Audit Logs</h2>
            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Timestamp</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td><span className="log-user">{log.username}</span></td>
                      <td><code>{log.action}</code></td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>
                        <button className="verify-btn" onClick={() => handleVerifyLog(log.id)}>Verify Integrity</button>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-table">No audit logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                    {accounts.map(acc => (
                      <tr key={acc.id}>
                        <td><strong>{acc.accountNumber}</strong></td>
                        <td>{acc.user?.id}</td>
                        <td>${acc.balance}</td>
                      </tr>
                    ))}
                    {accounts.length === 0 && (
                      <tr>
                        <td colSpan="3" className="empty-table">No accounts accessible or access denied.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}

            {role === 'ROLE_TELLER' && (
              <div className="transfer-portal card mb-4" style={{ padding: '20px', background: 'white', borderRadius: '8px' }}>
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
                    {transactionRequests.map(req => (
                      <tr key={req.id}>
                        <td>{req.id}</td>
                        <td>{req.initiator?.username}</td>
                        <td>{req.sourceAccount?.accountNumber}</td>
                        <td>{req.destAccount?.accountNumber}</td>
                        <td>${req.amount}</td>
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
              </div>
            )}
            
            {(role === 'ROLE_COMPLIANCE_OFFICER' || role === 'ROLE_ADMIN') && (
              <div className="logs-table-container">
                <div className="table-header">
                  <h3><FileText size={20} className="icon-blue" /> System Audit Logs</h3>
                </div>
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Timestamp</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td>{log.id}</td>
                        <td><span className="log-user">{log.username}</span></td>
                        <td><code>{log.action}</code></td>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>
                          <button className="verify-btn" onClick={() => handleVerifyLog(log.id)}>Verify Integrity</button>
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan="4" className="empty-table">No audit logs found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
