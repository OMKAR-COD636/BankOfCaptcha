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
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
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
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
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
        <div className={`phone-mockup-container ${isPasswordFocused ? 'active' : ''}`}>
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="app-header">
                <img src={logoUrl} alt="Bank Of Captcha Logo" className="app-logo" />
                <span>Bank of Captcha</span>
              </div>
              <div className="app-content">
                <div className="app-card">
                  <div className="card-balance">$24,500.00</div>
                  <div className="card-number">**** **** **** 1234</div>
                </div>
                <div className="app-actions">
                  <div className="action-btn">Send</div>
                  <div className="action-btn">Pay</div>
                  <div className="action-btn">More</div>
                </div>
                <div className="app-transactions">
                  <div className="transaction">
                    <div className="tx-icon"></div>
                    <div className="tx-details">
                      <div className="tx-title">Grocery Store</div>
                      <div className="tx-date">Today, 2:30 PM</div>
                    </div>
                    <div className="tx-amount negative">-$45.00</div>
                  </div>
                  <div className="transaction">
                    <div className="tx-icon"></div>
                    <div className="tx-details">
                      <div className="tx-title">Salary Deposit</div>
                      <div className="tx-date">Yesterday, 9:00 AM</div>
                    </div>
                    <div className="tx-amount positive">+$3,200.00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
