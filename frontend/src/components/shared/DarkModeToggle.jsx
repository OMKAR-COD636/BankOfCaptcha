import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import './DarkModeToggle.css';

/**
 * Shared dark mode toggle component.
 * Persists preference to localStorage and applies data-theme on <html>.
 * 
 * @param {string} variant - 'navbar' (white/blue on dark bg) | 'standalone' (auto-themed for light bg pages)
 */
const DarkModeToggle = ({ variant = 'navbar' }) => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <button
      className={`theme-toggle theme-toggle--${variant}`}
      onClick={() => setDarkMode(prev => !prev)}
      title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle dark mode"
    >
      {darkMode ? <Sun size={15} /> : <Moon size={15} />}
      <div className="theme-toggle__track">
        <div className="theme-toggle__knob" />
      </div>
      <span className="theme-toggle__label">{darkMode ? 'Light' : 'Dark'}</span>
    </button>
  );
};

export default DarkModeToggle;
