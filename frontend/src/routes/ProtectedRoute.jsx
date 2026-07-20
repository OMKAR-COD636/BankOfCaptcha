import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Route guard that redirects unauthenticated users to /login.
 * Optionally restricts to specific roles.
 *
 * @param {string[]} [allowedRoles] - e.g. ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN']
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect unauthorized roles to their default dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
