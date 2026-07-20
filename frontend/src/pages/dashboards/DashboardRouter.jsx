import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import CustomerDashboard from './CustomerDashboard';
import TellerDashboard from './TellerDashboard';
import BranchManagerDashboard from './BranchManagerDashboard';
import AdminDashboard from './AdminDashboard';
import ComplianceOfficerDashboard from './ComplianceOfficerDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';
import ItAdminDashboard from './ItAdminDashboard';

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
    case 'ROLE_IT_ADMIN':
      return <ItAdminDashboard />;
    default:
      // Unknown or missing role — send back to login so they see a proper error
      return <Navigate to="/login" replace />;
  }
};

export default DashboardRouter;

