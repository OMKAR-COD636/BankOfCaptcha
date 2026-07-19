import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import logoUrl from '../assets/logo.svg';
import './Dashboard.css';
import AlertReviewModal from '../components/AlertReviewModal';
import DarkModeToggle from '../components/DarkModeToggle';

import CustomerView from '../components/dashboard/CustomerView';
import SecurityTab from '../components/dashboard/SecurityTab';
import StaffTab from '../components/dashboard/StaffTab';
import BranchTab from '../components/dashboard/BranchTab';
import ComplianceTab from '../components/dashboard/ComplianceTab';
import AiModelTab from '../components/dashboard/AiModelTab';
import ManagerTab from '../components/dashboard/ManagerTab';
import TellerTab from '../components/dashboard/TellerTab';

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [aiAlerts, setAiAlerts] = useState([]);
  const [aiMetrics, setAiMetrics] = useState(null);
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
  
  const [selectedAlertForReview, setSelectedAlertForReview] = useState(null);
  
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || '';
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');

  // Initialize active tab based on role
  const [activeAdminTab, setActiveAdminTab] = useState(role === 'ROLE_IT_ADMIN' ? 'ai_model' : 'security');

  const [accountPage, setAccountPage] = useState(1);
  const itemsPerPage = 20;

  // Sticky navbar
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    if (currentY > lastScrollY.current && currentY > 80) {
      setNavHidden(true);  
    } else {
      setNavHidden(false); 
    }
    lastScrollY.current = currentY;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (role === 'ROLE_SUPER_ADMIN' || role === 'ROLE_ADMIN' || role === 'ROLE_COMPLIANCE_OFFICER' || role === 'ROLE_IT_ADMIN') {
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

      if (role === 'ROLE_SUPER_ADMIN' || role === 'ROLE_IT_ADMIN') {
        fetch('http://localhost:8080/api/ai/alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setAiAlerts(data))
        .catch(err => console.error(err));

        fetch('http://localhost:8080/api/ai/training/metrics', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setAiMetrics(data))
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

  const handleFalsePositive = async (id, currentVal) => {
    try {
      const res = await fetch(`http://localhost:8080/api/ai/alerts/${id}/feedback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isFalsePositive: !currentVal })
      });
      if (res.ok) {
        setAiAlerts(prev => prev.map(a => a.id === id ? { ...a, isFalsePositive: !currentVal } : a));
      } else {
        alert("Failed to update feedback");
      }
    } catch (err) {
      alert("Failed to update feedback");
    }
  };

  const triggerAdaptiveTraining = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/ai/training/trigger`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Adaptive training triggered. The AI engine will pick this up shortly.");
        fetch('http://localhost:8080/api/ai/training/metrics', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setAiMetrics(data));
      } else {
        alert("Failed to trigger training");
      }
    } catch (err) {
      alert("Failed to trigger training");
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
        setAiAlerts(prev => prev.map(a => ({ ...a, status: 'RESOLVED' })));
      } else {
        alert(data.error || "Failed to resolve all alerts.");
      }
    } catch (err) {
      alert("Failed to resolve all alerts.");
    }
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
      } else { alert(data.error); }
    } catch (err) { alert('Failed to create staff'); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {selectedAlertForReview && (
        <AlertReviewModal alert={selectedAlertForReview} token={token} onClose={() => setSelectedAlertForReview(null)} />
      )}
      <nav className={`navbar${navHidden ? ' navbar--hidden' : ''}`}>
        <div className="nav-brand">
          <img src={logoUrl} alt="Bank Of Captcha Logo" width="28" height="28" />
          <span>BANK OF CAPTCHA</span>
        </div>
        <div className="nav-user">
          <User size={20} />
          <span className="user-info">{username} <span className="role-badge">{role.replace('ROLE_', '')}</span></span>
          <DarkModeToggle variant="navbar" />
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
          <CustomerView 
            accounts={accounts}
            accountPage={accountPage}
            setAccountPage={setAccountPage}
            itemsPerPage={itemsPerPage}
            transferForm={transferForm}
            setTransferForm={setTransferForm}
            handleTransfer={handleTransfer}
            transferMsg={transferMsg}
          />
        ) : role === 'ROLE_TELLER' ? (
          <TellerTab 
            kycRequests={kycRequests}
            itemsPerPage={itemsPerPage}
          />
        ) : role === 'ROLE_BRANCH_MANAGER' ? (
          <ManagerTab 
            transactionRequests={transactionRequests}
            handleApprove={handleApprove}
            handleReject={handleReject}
            itemsPerPage={itemsPerPage}
          />
        ) : role === 'ROLE_COMPLIANCE_OFFICER' ? (
          <ComplianceTab 
            logs={logs}
            users={users}
            handleVerifyLog={handleVerifyLog}
            itemsPerPage={itemsPerPage}
          />
        ) : (role === 'ROLE_SUPER_ADMIN' || role === 'ROLE_IT_ADMIN') ? (
          <div className="admin-view">
            <div className="admin-tabs">
              {role === 'ROLE_SUPER_ADMIN' && (
                <button className={`admin-tab ${activeAdminTab === 'security' ? 'active' : ''}`} onClick={() => setActiveAdminTab('security')}>
                  Security & Intelligence
                </button>
              )}
              
              {role === 'ROLE_IT_ADMIN' && (
                <button className={`admin-tab ${activeAdminTab === 'ai_model' ? 'active' : ''}`} onClick={() => setActiveAdminTab('ai_model')}>
                  AI Model & Training
                </button>
              )}

              {role === 'ROLE_SUPER_ADMIN' && (
                <>
                  <button className={`admin-tab ${activeAdminTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveAdminTab('staff')}>
                    Staff Management
                  </button>
                  <button className={`admin-tab ${activeAdminTab === 'branch' ? 'active' : ''}`} onClick={() => setActiveAdminTab('branch')}>
                    Branch Operations
                  </button>
                  <button className={`admin-tab ${activeAdminTab === 'compliance' ? 'active' : ''}`} onClick={() => setActiveAdminTab('compliance')}>
                    Compliance & Audit
                  </button>
                </>
              )}
            </div>

            {activeAdminTab === 'security' && role === 'ROLE_SUPER_ADMIN' && (
              <SecurityTab 
                aiAlerts={aiAlerts}
                logs={logs}
                transactionRequests={transactionRequests}
                users={users}
                handleResolveAllAlerts={handleResolveAllAlerts}
                handleResolveAlert={handleResolveAlert}
                setSelectedAlertForReview={setSelectedAlertForReview}
                handleFalsePositive={handleFalsePositive}
                itemsPerPage={itemsPerPage}
              />
            )}

            {activeAdminTab === 'ai_model' && (
              <AiModelTab 
                aiMetrics={aiMetrics}
                triggerAdaptiveTraining={triggerAdaptiveTraining}
              />
            )}

            {activeAdminTab === 'staff' && role === 'ROLE_SUPER_ADMIN' && (
              <StaffTab 
                createStaffForm={createStaffForm}
                setCreateStaffForm={setCreateStaffForm}
                handleCreateStaff={handleCreateStaff}
                branches={branches}
                users={users}
              />
            )}

            {activeAdminTab === 'branch' && role === 'ROLE_SUPER_ADMIN' && (
              <BranchTab 
                createBranchForm={createBranchForm}
                setCreateBranchForm={setCreateBranchForm}
                handleCreateBranch={handleCreateBranch}
                branches={branches}
              />
            )}

            {activeAdminTab === 'compliance' && role === 'ROLE_SUPER_ADMIN' && (
              <ComplianceTab 
                logs={logs}
                users={users}
                handleVerifyLog={handleVerifyLog}
                itemsPerPage={itemsPerPage}
              />
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default Dashboard;
