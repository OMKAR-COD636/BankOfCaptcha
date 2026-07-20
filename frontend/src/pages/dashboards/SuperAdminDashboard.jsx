import { useEffect, useState } from 'react';
import DashboardShell from '../../components/shared/DashboardShell';
import AuditLogTable from '../../components/shared/AuditLogTable';
import SecurityTab from '../../components/superadmin/SecurityTab';
import StaffManagementTab from '../../components/superadmin/StaffManagementTab';
import BranchOperationsTab from '../../components/superadmin/BranchOperationsTab';
import useAuth from '../../hooks/useAuth';
import * as api from '../../api/client';

/**
 * Super Admin Dashboard
 * 4-tab interface:
 *   1. Security & Intelligence (AI alerts, risk graphs)
 *   2. Staff Management (create/assign staff)
 *   3. Branch Operations (create branches)
 *   4. Compliance & Audit (audit logs)
 */
const SuperAdminDashboard = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('security');

  // Shared data across tabs
  const [logs, setLogs] = useState([]);
  const [aiAlerts, setAiAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [transactionRequests, setTransactionRequests] = useState([]);

  useEffect(() => {
    api.fetchAuditLogs(token).then(setLogs).catch(console.error);
    api.fetchAiAlerts(token).then(setAiAlerts).catch(console.error);
    api.fetchUsers(token).then(setUsers).catch(console.error);
    api.fetchBranches(token).then(setBranches).catch(console.error);
  }, [token]);

  const tabs = [
    { key: 'security', label: 'Security & Intelligence' },
    { key: 'staff', label: 'Staff Management' },
    { key: 'branch', label: 'Branch Operations' },
    { key: 'compliance', label: 'Compliance & Audit' },
  ];

  return (
    <DashboardShell>
      <div className="admin-view">
        {/* Tab Navigation */}
        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'security' && (
          <SecurityTab
            aiAlerts={aiAlerts}
            setAiAlerts={setAiAlerts}
            users={users}
            token={token}
            logs={logs}
            transactionRequests={transactionRequests}
          />
        )}

        {activeTab === 'staff' && (
          <StaffManagementTab
            users={users}
            branches={branches}
            token={token}
          />
        )}

        {activeTab === 'branch' && (
          <BranchOperationsTab
            branches={branches}
            setBranches={setBranches}
            token={token}
          />
        )}

        {activeTab === 'compliance' && (
          <div className="admin-tab-content animated-fade-in">
            <AuditLogTable logs={logs} users={users} token={token} />
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default SuperAdminDashboard;
