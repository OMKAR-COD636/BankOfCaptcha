import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import logoUrl from '../assets/logo.svg';
import './Login.css';
import DarkModeToggle from '../components/DarkModeToggle';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [branches, setBranches] = useState([]);
  const [regForm, setRegForm] = useState({ fullName: '', aadhaarNumber: '', mobileNumber: '', email: '', branchId: '' });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const navigate = useNavigate();

  // Sync theme on mount
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  React.useEffect(() => {
    if (isRegistering && branches.length === 0) {
      fetch('http://localhost:8080/api/branches')
        .then(res => res.json())
        .then(data => setBranches(data))
        .catch(err => console.error("Failed to load branches"));
    }
  }, [isRegistering, branches.length]);

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, ...regForm }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setIsRegistering(false);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Registration failed');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-top-bar">
          <div className="logo">
            <img src={logoUrl} alt="Bank Of Captcha Logo" className="logo-icon" width="32" height="32" />
            <span>BANK OF CAPTCHA</span>
          </div>
          <DarkModeToggle variant="standalone" />
        </div>

        <div className="login-form-container">
          <h2>{isRegistering ? 'Apply for an Account (KYC)' : 'Sign In to Your Account'}</h2>
          <p className="subtitle">Secure Government Banking Portal</p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button type="button" onClick={() => setIsRegistering(false)} style={{ padding: '8px', background: !isRegistering ? '#2563eb' : '#e5e7eb', color: !isRegistering ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>Login</button>
            <button type="button" onClick={() => setIsRegistering(true)} style={{ padding: '8px', background: isRegistering ? '#2563eb' : '#e5e7eb', color: isRegistering ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>Apply for Account</button>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} required />
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
                  {showPassword ? <EyeOff size={20} color="#6c757d" /> : <Eye size={20} color="#6c757d" />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="John Doe" value={regForm.fullName} onChange={e => setRegForm({ ...regForm, fullName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Aadhaar Number</label>
                  <input type="text" placeholder="1234 5678 9012" value={regForm.aadhaarNumber} onChange={e => setRegForm({ ...regForm, aadhaarNumber: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input type="text" placeholder="9876543210" value={regForm.mobileNumber} onChange={e => setRegForm({ ...regForm, mobileNumber: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email ID</label>
                  <input type="email" placeholder="john@example.com" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Preferred Branch</label>
                  <select value={regForm.branchId} onChange={e => setRegForm({ ...regForm, branchId: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                    <option value="">-- Select a Branch --</option>
                    {branches.map(b => <option key={b.id} value={b.branchId}>{b.name} ({b.location})</option>)}
                  </select>
                </div>
              </>
            )}

            {!isRegistering && (
              <div className="form-options">
                <label className="checkbox-container">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <a href="#" className="forgot-password">Forgot password?</a>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-btn">{isRegistering ? 'Submit KYC Application' : 'Sign In'}</button>
          </form>

          {!isRegistering && (
            <div className="demo-credentials">
              <p><strong>Demo Accounts:</strong></p>
              <ul>
                <li>Customer: <code>customer</code> / <code>password</code></li>
                <li>Admin: <code>admin</code> / <code>password</code></li>
                <li>Super Admin: <code>superadmin</code> / <code>password</code></li>
              </ul>
            </div>
          )}
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
                  <div className="card-balance">₹24,500.00</div>
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
                    <div className="tx-amount negative">-₹45.00</div>
                  </div>
                  <div className="transaction">
                    <div className="tx-icon"></div>
                    <div className="tx-details">
                      <div className="tx-title">Salary Deposit</div>
                      <div className="tx-date">Yesterday, 9:00 AM</div>
                    </div>
                    <div className="tx-amount positive">+₹3,200.00</div>
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
