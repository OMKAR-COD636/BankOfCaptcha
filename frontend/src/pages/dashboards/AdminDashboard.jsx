import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import DashboardShell from '../../components/shared/DashboardShell';
import AuditLogTable from '../../components/shared/AuditLogTable';
import useAuth from '../../hooks/useAuth';
import * as api from '../../api/client';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * Admin Dashboard
 * Shows: Audit logs with search, filters, and integrity verification.
 */
const AdminDashboard = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.fetchAuditLogs(token).then(setLogs).catch(console.error);
    api.fetchUsers(token).then(setUsers).catch(console.error);
  }, [token]);

  return (
    <DashboardShell>
      <h2 className="section-title">
        <ShieldAlert size={24} className="icon-blue" /> System Audit Logs
      </h2>
      <AuditLogTable logs={logs} users={users} token={token} />
    </DashboardShell>
  );
};

export default AdminDashboard;
