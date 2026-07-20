import Navbar from './Navbar';
import useAuth from '../../hooks/useAuth';
import './DashboardShell.css';

/**
 * Shared dashboard shell providing the Navbar + hero banner + main content area.
 * All role-specific dashboards render inside this shell.
 */
const DashboardShell = ({ children }) => {
  const { username } = useAuth();

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="hero-banner">
        <div className="container">
          <h1>Welcome, {username}</h1>
          <p>Official Government Banking Portal</p>
        </div>
      </div>
      <main className="dashboard-main container">
        {children}
      </main>
    </div>
  );
};

export default DashboardShell;
