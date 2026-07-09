import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, ShieldAlert } from 'lucide-react';
import logoUrl from '../assets/logo.svg';
import './Dashboard.css';

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (role === 'ROLE_ADMIN' || role === 'ROLE_SUPER_ADMIN') {
      fetch('http://localhost:8080/api/admin/audit-logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => console.error(err));
    }
  }, [token, role, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="nav-brand" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <img src={logoUrl} alt="Bank Of Captcha Logo" width="24" height="24" />
          BANK OF CAPTCHA
        </div>
        <div className="nav-user">
          <User size={20} />
          <span>{username} ({role})</span>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        {role === 'ROLE_CUSTOMER' ? (
          <div className="customer-view">
            <h2>Welcome, {username}!</h2>
            <div className="balance-card">
              <h3>Total Balance</h3>
              <div className="balance-amount">$12,450.00</div>
            </div>
          </div>
        ) : (
          <div className="admin-view">
            <h2><ShieldAlert size={24} /> Security & Audit Logs</h2>
            <p>Monitor the usage of privileged accounts to detect potential misuse.</p>
            
            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td><span className="log-user">{log.username}</span></td>
                      <td>{log.action}</td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{textAlign: 'center'}}>No audit logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
