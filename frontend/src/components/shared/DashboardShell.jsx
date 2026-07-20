import Navbar from './Navbar';
import useAuth from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/LanguageContext';
import './DashboardShell.css';

/**
 * Shared dashboard shell providing the Navbar + hero banner + main content area.
 * All role-specific dashboards render inside this shell.
 */
const DashboardShell = ({ children }) => {
  const { username } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="hero-banner">
        <div className="container">
          <h1>{t('dashboard.welcome')}, {username}</h1>
          <p>{t('login.subtitle')}</p>
        </div>
      </div>
      <main className="dashboard-main container">
        {children}
      </main>
    </div>
  );
};

export default DashboardShell;
