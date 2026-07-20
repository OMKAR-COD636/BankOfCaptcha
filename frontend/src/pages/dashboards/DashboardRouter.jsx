import useAuth from '../../hooks/useAuth';
import CustomerDashboard from './CustomerDashboard';
import TellerDashboard from './TellerDashboard';
import BranchManagerDashboard from './BranchManagerDashboard';
import AdminDashboard from './AdminDashboard';
import ComplianceOfficerDashboard from './ComplianceOfficerDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';

/**
 * DashboardRouter — maps the authenticated user's role to their specific dashboard.
 * This is the single entry point at /dashboard, keeping the URL simple
 * while each role gets a completely separate component tree.
 */
const DashboardRouter = () => {
  const { role } = useAuth();

  switch (role) {
    case 'ROLE_CUSTOMER':
      return <CustomerDashboard />;
    case 'ROLE_TELLER':
      return <TellerDashboard />;
    case 'ROLE_BRANCH_MANAGER':
      return <BranchManagerDashboard />;
    case 'ROLE_ADMIN':
      return <AdminDashboard />;
    case 'ROLE_COMPLIANCE_OFFICER':
      return <ComplianceOfficerDashboard />;
    case 'ROLE_SUPER_ADMIN':
      return <SuperAdminDashboard />;
    default:
      return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <h2>Unknown Role</h2>
          <p>Your account role "{role}" is not recognized. Contact an administrator.</p>
        </div>
      );
  }
};

export default DashboardRouter;
