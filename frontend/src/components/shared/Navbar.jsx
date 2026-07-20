import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import logoUrl from '../../assets/logo.svg';
import DarkModeToggle from './DarkModeToggle';
import useAuth from '../../hooks/useAuth';
import './Navbar.css';

/**
 * Shared top navigation bar for all dashboard pages.
 * Handles hide-on-scroll-down, show-on-scroll-up behaviour.
 */
const Navbar = () => {
  const { username, role, logout } = useAuth();
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
      <div className="nav-brand">
        <img src={logoUrl} alt="Bank Of Captcha Logo" width="28" height="28" />
        <span>BANK OF CAPTCHA</span>
      </div>
      <div className="nav-user">
        <User size={20} />
        <span className="user-info">
          {username} <span className="role-badge">{displayRole}</span>
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
