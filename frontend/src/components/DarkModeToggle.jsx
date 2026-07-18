import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import './DarkModeToggle.css';

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button 
      className={`dark-mode-toggle ${isDark ? 'dark' : 'light'}`}
      onClick={() => setIsDark(!isDark)}
      aria-label="Toggle Dark Mode"
    >
      <div className="toggle-track">
        <div className="toggle-thumb">
          {isDark ? <Moon size={14} /> : <Sun size={14} />}
        </div>
      </div>
    </button>
  );
};

export default DarkModeToggle;
