import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import logoUrl from '../../assets/logo.svg';
import DarkModeToggle from './DarkModeToggle';
import useAuth from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/LanguageContext';
import './Navbar.css';

/**
 * Shared top navigation bar for all dashboard pages.
 * Handles hide-on-scroll-down, show-on-scroll-up behaviour.
 */
const Navbar = () => {
  const { username, role, logout } = useAuth();
  const { language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    if (currentY > lastScrollY.current && currentY > 80) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    lastScrollY.current = currentY;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayRole = role?.replace('ROLE_', '') || '';

  return (
    <nav className={`navbar${hidden ? ' navbar--hidden' : ''}`}>
      <div className="nav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} title="Back to home">
        <img src={logoUrl} alt="Bank Of Captcha Logo" width="28" height="28" />
        <span>BANK OF CAPTCHA</span>
      </div>
      <div className="nav-user">
        <User size={20} />
        <span className="user-info">
          {username} <span className="role-badge">{displayRole}</span>
        </span>
        <span className="lang-switcher" style={{marginRight: '15px', display: 'flex', gap: '5px', fontSize: '0.9rem', color: 'var(--text-color)'}}>
          <span style={{cursor: 'pointer', fontWeight: language === 'en' ? 'bold' : 'normal'}} onClick={() => setLanguage('en')}>EN</span> | 
          <span style={{cursor: 'pointer', fontWeight: language === 'hi' ? 'bold' : 'normal'}} onClick={() => setLanguage('hi')}>HI</span> | 
          <span style={{cursor: 'pointer', fontWeight: language === 'mr' ? 'bold' : 'normal'}} onClick={() => setLanguage('mr')}>MR</span>
        </span>
        <DarkModeToggle variant="navbar" />
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
