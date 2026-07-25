import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import logoUrl from '../assets/logo.svg';
import './Login.css';
import { useTranslation } from '../i18n/LanguageContext';
import DarkModeToggle from '../components/shared/DarkModeToggle';
import useAuth from '../hooks/useAuth';
import { useToast } from '../components/shared/ToastContext';
import * as api from '../api/client';

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
  const auth = useAuth();
  const { t } = useTranslation();
  const showToast = useToast();

  // Sync theme on mount
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [auth.isAuthenticated, navigate]);

  useEffect(() => {
    if (isRegistering && branches.length === 0) {
      api.fetchBranchesPublic()
        .then(setBranches)
        .catch(() => console.error('Failed to load branches'));
    }
  }, [isRegistering, branches.length]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await api.login(username, password);
      auth.login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.error || 'Invalid credentials');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await api.register({ username, password, ...regForm });
      showToast(data.message, 'success');
      setIsRegistering(false);
    } catch (err) {
      setError(err.error || 'Registration failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-top-bar">
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} title="Back to home">
            <img src={logoUrl} alt="Bank Of Captcha Logo" className="logo-icon" width="32" height="32" />
            <span>BANK OF CAPTCHA</span>
          </div>
          <DarkModeToggle variant="standalone" />
        </div>

        <div className="login-form-container">
          <h2>{isRegistering ? t('login.applyTitle') : t('login.signInTitle')}</h2>
          <p className="subtitle">{t('login.subtitle')}</p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button type="button" onClick={() => setIsRegistering(false)} style={{ padding: '8px', background: !isRegistering ? '#2563eb' : '#e5e7eb', color: !isRegistering ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>{t('login.loginTab')}</button>
            <button type="button" onClick={() => setIsRegistering(true)} style={{ padding: '8px', background: isRegistering ? '#2563eb' : '#e5e7eb', color: isRegistering ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>{t('login.applyTab')}</button>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin}>
            <div className="form-group">
              <label>{t('login.username')}</label>
              <input type="text" placeholder={t('login.usernamePlaceholder')} value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>{t('login.password')}</label>
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
                  <label>{t('login.fullName')}</label>
                  <input type="text" placeholder={t('login.fullNamePlaceholder')} value={regForm.fullName} onChange={e => setRegForm({ ...regForm, fullName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>{t('login.aadhaar')}</label>
                  <input type="text" placeholder="1234 5678 9012" value={regForm.aadhaarNumber} onChange={e => setRegForm({ ...regForm, aadhaarNumber: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>{t('login.mobile')}</label>
                  <input type="text" placeholder="9876543210" value={regForm.mobileNumber} onChange={e => setRegForm({ ...regForm, mobileNumber: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>{t('login.email')}</label>
                  <input type="email" placeholder="john@example.com" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>{t('login.branch')}</label>
                  <select value={regForm.branchId} onChange={e => setRegForm({ ...regForm, branchId: e.target.value })} required>
                    <option value="">{t('login.selectBranch')}</option>
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
                  {t('login.remember')}
                </label>
                <a href="#" className="forgot-password">{t('login.forgot')}</a>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-btn">{isRegistering ? 'Submit KYC Application' : 'Sign In'}</button>
          </form>

          {!isRegistering && (
            <div className="demo-credentials">
              <p><strong>{t('login.demo')}:</strong></p>
              <ul>
                <li>Customer: <code>customer</code> / <code>password</code></li>
                <li>Teller: <code>teller</code> / <code>password</code></li>
                <li>Branch Manager: <code>branch_manager</code> / <code>password</code></li>
                <li>IT Admin: <code>it_admin</code> / <code>password</code></li>
                <li>Super Admin: <code>superadmin</code>, <code>superadmin1</code>, <code>superadmin2</code> / <code>password</code></li>
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
