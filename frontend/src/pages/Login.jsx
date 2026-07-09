import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import logoUrl from '../assets/logo.svg';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
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
          <h2>Sign In</h2>
          <p className="subtitle">Welcome back! Please enter your details</p>
          
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
                Remember for 30 Days
              </label>
              <a href="#" className="forgot-password">Forgot password</a>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-btn">Sign In</button>
          </form>

          <div className="demo-credentials">
            <p>Demo Accounts:</p>
            <ul>
              <li>Customer: <code>customer</code> / <code>password</code></li>
              <li>Admin: <code>admin</code> / <code>password</code></li>
              <li>Super Admin: <code>superadmin</code> / <code>password</code></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="login-right">
        <div className="phone-scene">

            <div className={`phone ${isPasswordFocused ? "zoom" : ""}`}>

                <div className="phone-notch"></div>

                <div className="phone-screen">

                    <div className="phone-header">
                        BANK OF CAPTCHA
                    </div>

                    <div className="screen-content">
                        <div className="card">
                            <div className="wrapper">
                                <img src="https://ggayane.github.io/css-experiments/cards/dark_rider-cover.jpg" className="cover-image" alt="cover" />
                            </div>
                            <img src="https://ggayane.github.io/css-experiments/cards/dark_rider-title.png" className="title" alt="title" />
                            <img src="https://ggayane.github.io/css-experiments/cards/dark_rider-character.webp" className="character" alt="character" />
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
