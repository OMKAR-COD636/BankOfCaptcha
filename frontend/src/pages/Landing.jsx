import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, Phone, Mail, Search, ChevronRight, 
  Home, Car, Gem, Landmark, CreditCard, Shield, 
  Globe, User, MapPin, Percent, HelpCircle, FileText
} from 'lucide-react';
import './Landing.css';
import DarkModeToggle from '../components/shared/DarkModeToggle';
import useAuth from '../hooks/useAuth';

const Landing = () => {
  const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);
  const auth = useAuth();

  const banners = [
    {
      title: "Quantum-Secure AI Banking",
      subtitle: "Experience the next generation of financial security with our PQC-secured audit logging.",
      cta: "Learn More"
    },
    {
      title: "Real-time Threat Detection",
      subtitle: "Our PyTorch-based AI module ensures your assets are protected against insider threats 24/7.",
      cta: "Explore Security"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Log out user if they navigate back to the landing page
  useEffect(() => {
    if (auth.isAuthenticated) {
      auth.logout();
    }
  }, [auth.isAuthenticated, auth.logout]);

  // Sync theme on mount
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="landing-container">
      {/* Top Utility Bar */}
      <div className="utility-bar">
        <div className="utility-left">
          <span className="contact-item"><Phone size={14} /> Toll Free: 1800-CAPTCHA-BANK</span>
          <span className="contact-item"><Mail size={14} /> support@bankofcaptcha.com</span>
        </div>
        <div className="utility-right">
          <span className="lang-switcher">English | हिन्दी | मराठी</span>
          <DarkModeToggle variant="standalone" />
        </div>
      </div>

      {/* Main Header & Nav */}
      <header className="main-header">
        <div className="logo-container">
          <Shield className="logo-icon" size={32} color="#1A3C7B" />
          <div className="logo-text">
            <h1>Bank of Captcha</h1>
            <span>One Family One Bank</span>
          </div>
        </div>
        
        <nav className="primary-nav">
          <a href="#">Personal</a>
          <a href="#">Corporate</a>
          <a href="#">MSME</a>
          <a href="#">Agriculture</a>
          <a href="#">Digital Banking</a>
          <button className="login-btn" onClick={handleLogin}>
            LOG-IN <ChevronRight size={16} />
          </button>
        </nav>
      </header>

      {/* Hero Banner Carousel */}
      <section className="hero-section">
        <div className="hero-content">
          <h2>{banners[currentBanner].title}</h2>
          <p>{banners[currentBanner].subtitle}</p>
          <button className="hero-cta">{banners[currentBanner].cta}</button>
        </div>
        <div className="carousel-dots">
          {banners.map((_, idx) => (
            <span 
              key={idx} 
              className={`dot ${idx === currentBanner ? 'active' : ''}`}
              onClick={() => setCurrentBanner(idx)}
            />
          ))}
        </div>
      </section>

      {/* Quick Action Strip */}
      <div className="quick-actions-strip">
        <a href="#"><Globe size={16} /> Online SB Account</a>
        <a href="#"><User size={16} /> Investor Relations</a>
        <a href="#"><MapPin size={16} /> Branch/ATM Locator</a>
        <a href="#"><HelpCircle size={16} /> Helpline</a>
      </div>

      {/* News Ticker */}
      <div className="news-ticker">
        <div className="ticker-label">
          <span className="badge">NEW</span> What's new!
        </div>
        <div className="ticker-content-wrapper">
          <div className="ticker-content">
            <a href="#">Security Update: Advanced LSTM Autoencoder deployed for insider threat detection.</a>
            <span className="divider">|</span>
            <a href="#">Important Notice regarding PQC-secured audit logging implementation.</a>
            <span className="divider">|</span>
            <a href="#">System Maintenance scheduled for this weekend.</a>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="main-layout">
        
        {/* Left/Center Content */}
        <div className="content-area">
          <section className="quick-links-section">
            <h2 className="section-title">What are you looking for?</h2>
            <div className="quick-links-grid">
              <div className="link-card">
                <Home className="link-icon" />
                <span>Home Loans</span>
              </div>
              <div className="link-card">
                <Car className="link-icon" />
                <span>Car Loan</span>
              </div>
              <div className="link-card">
                <Gem className="link-icon" />
                <span>Gold Loan</span>
              </div>
              <div className="link-card">
                <Percent className="link-icon" />
                <span>Deposit Rates</span>
              </div>
              <div className="link-card">
                <Building2 className="link-icon" />
                <span>Corporate</span>
              </div>
              <div className="link-card">
                <CreditCard className="link-icon" />
                <span>Credit Cards</span>
              </div>
              <div className="link-card">
                <Landmark className="link-icon" />
                <span>Govt Schemes</span>
              </div>
              <div className="link-card">
                <FileText className="link-icon" />
                <span>Downloads</span>
              </div>
            </div>
          </section>

          <section className="ancillary-products">
            <h2 className="section-title">Ancillary Products</h2>
            <div className="products-carousel">
              <div className="product-card">Lockers</div>
              <div className="product-card">Insurance</div>
              <div className="product-card">Pension System</div>
              <div className="product-card">Trading Services</div>
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="sidebar">
          <div className="sidebar-tabs">
            <div className="tab active">Interest Rates</div>
            <div className="tab">Apply Online</div>
            <div className="tab">Calculators</div>
          </div>
          <div className="sidebar-content">
            <div className="rate-row">
              <span className="rate-name">Housing Loan</span>
              <span className="rate-value">7.10% P.A*</span>
              <button className="apply-btn">Apply Now!</button>
            </div>
            <div className="rate-row">
              <span className="rate-name">Car Loan</span>
              <span className="rate-value">7.45% P.A*</span>
              <button className="apply-btn">Apply Now!</button>
            </div>
            <div className="rate-row">
              <span className="rate-name">Gold Loan</span>
              <span className="rate-value">8.50% P.A*</span>
              <button className="apply-btn">Apply Now!</button>
            </div>
            <div className="rate-row">
              <span className="rate-name">Deposit Schemes</span>
              <span className="rate-value">7.15% P.A*</span>
              <button className="apply-btn blue">Know More</button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-columns">
          <div className="footer-col">
            <h3>Disclosure</h3>
            <a href="#">Basel II Disclosure</a>
            <a href="#">ESG Disclosures</a>
            <a href="#">RTI</a>
          </div>
          <div className="footer-col">
            <h3>Compliance</h3>
            <a href="#">Citizen Charter</a>
            <a href="#">Complaint Mechanism</a>
            <a href="#">Important Policies</a>
          </div>
          <div className="footer-col">
            <h3>Important Links</h3>
            <a href="#">KYC Compliance Check</a>
            <a href="#">Wilful Defaulters</a>
            <a href="#">Verify CheckSum Value</a>
          </div>
          <div className="footer-col">
            <h3>Get In Touch</h3>
            <p>Bank of Captcha Head Office<br/>Tech Park, Cyber City<br/>Sector-5, 411005</p>
          </div>
        </div>
        
        <div className="security-banner">
          <strong>Important:</strong> Bank of Captcha never asks for Bank account details for any purpose through phone call/email/SMS. Never share your CVV/PIN No. of Debit/Credit card to anyone.
        </div>
        
        <div className="footer-bottom">
          <div className="copyright">© 2026 Bank of Captcha. All Rights Reserved</div>
          <div className="footer-links">
            <a href="#">Disclaimer</a> | <a href="#">Privacy Policy</a> | <a href="#">Terms & Conditions</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
