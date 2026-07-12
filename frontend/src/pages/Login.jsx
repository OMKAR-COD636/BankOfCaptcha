import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import logoUrl from '../assets/logo.svg';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', data.username);
        navigate('/dashboard');
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Failed to connect to the server. Is the backend running?');
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="logo">
          <img src={logoUrl} alt="Bank Of Captcha Logo" className="logo-icon" width="32" height="32" />
          <span>BANK OF CAPTCHA</span>
        </div>
        
        <div className="login-form-container">
          <h2>Sign In to Your Account</h2>
          <p className="subtitle">Secure Government Banking Portal</p>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                placeholder="Enter your username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="icon-button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} color="#6c757d"/> : <Eye size={20} color="#6c757d"/>}
                </button>
              </div>
            </div>
            
            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-btn">Sign In</button>
          </form>

          <div className="demo-credentials">
            <p><strong>Demo Accounts:</strong></p>
            <ul>
              <li>Customer: <code>customer</code> / <code>password</code></li>
              <li>Admin: <code>admin</code> / <code>password</code></li>
              <li>Super Admin: <code>superadmin</code> / <code>password</code></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="login-right">
        <div className="info-panel">
          <h3>Official Government Service</h3>
          <p>
            This is a secure portal for the Bank of Captcha. Unauthorized access is strictly prohibited and monitored.
          </p>
          
          <div className="security-notice">
            <h4>Security Notice</h4>
            <p>
              We use advanced Post-Quantum Cryptography (PQC) to protect your audit records. Your sessions are securely encrypted.
            </p>
          </div>
          
          <div className="contact-info">
            <h4>Need Help?</h4>
            <p>Contact the IT Service Desk at 1-800-GOV-BANK.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
