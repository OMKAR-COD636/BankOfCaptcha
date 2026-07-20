import React, { useState, useEffect, useRef } from 'react';
import ReactGlobe from 'react-globe.gl';
import { Link, useNavigate } from 'react-router-dom';
import { fetchBranchesPublic } from '../api/client';
import { 
  Building2, Phone, Mail, Search, ChevronRight, 
  Home, Car, Gem, Landmark, CreditCard, Shield, 
  Globe, User, MapPin, Percent, HelpCircle, FileText
} from 'lucide-react';
import './Landing.css';
import DarkModeToggle from '../components/shared/DarkModeToggle';

const Landing = () => {
  const navigate = useNavigate();
    const [currentBanner, setCurrentBanner] = useState(0);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showHelplineModal, setShowHelplineModal] = useState(false);
  const globeEl = useRef();
  const [globeSize, setGlobeSize] = useState({ width: 800, height: 400 });

  useEffect(() => {
    if (showMapModal) {
      setGlobeSize({
        width: Math.min(window.innerWidth * 0.85, 1100),
        height: Math.min(window.innerHeight * 0.75, 800)
      });
      const handleResize = () => {
        setGlobeSize({
          width: Math.min(window.innerWidth * 0.85, 1100),
          height: Math.min(window.innerHeight * 0.75, 800)
        });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [showMapModal]);
  
  useEffect(() => {
    if (showMapModal && globeEl.current) {
      // Zoom to India after a short delay
      setTimeout(() => {
        globeEl.current.pointOfView({ lat: 20.5937, lng: 78.9629, altitude: 0.8 }, 2000);
      }, 500);
    }
  }, [showMapModal]);

  const [dbBranches, setDbBranches] = useState([]);

  useEffect(() => {
    // Fall back to pre-entered accurate locations for Mumbai, Pune, Delhi, and Kolkata
    // Shifted Mumbai and Pune slightly east (inland) so they don't appear in the ocean on the globe texture
    const fallbackLocations = [
      { lat: 19.0760, lng: 76.8777, name: 'Mumbai Branch', location: 'Mumbai', id: 1 },
      { lat: 18.5204, lng: 77.8567, name: 'Pune Branch', location: 'Pune', id: 2 },
      { lat: 28.7041, lng: 77.1025, name: 'Delhi Branch', location: 'Delhi', id: 3 },
      { lat: 22.5726, lng: 88.3639, name: 'Kolkata Branch', location: 'Kolkata', id: 4 },
    ];
    setDbBranches(fallbackLocations);
  }, []);


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
  }, []);

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
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Personal</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Corporate</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>MSME</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Agriculture</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Digital Banking</a>
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
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}><Globe size={16} /> Online SB Account</a>
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}><User size={16} /> Investor Relations</a>
        <a href="#" onClick={(e) => { e.preventDefault(); setShowMapModal(true); }}><MapPin size={16} /> Branch/ATM Locator</a>
        <a href="#" onClick={(e) => { e.preventDefault(); setShowHelplineModal(true); }}><HelpCircle size={16} /> Helpline</a>
      </div>

      {/* News Ticker */}
      <div className="news-ticker">
        <div className="ticker-label">
          <span className="badge">NEW</span> What's new!
        </div>
        <div className="ticker-content-wrapper">
          <div className="ticker-content">
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Security Update: Advanced LSTM Autoencoder deployed for insider threat detection.</a>
            <span className="divider">|</span>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Important Notice regarding PQC-secured audit logging implementation.</a>
            <span className="divider">|</span>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>System Maintenance scheduled for this weekend.</a>
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
              <div className="link-card" onClick={handleLogin}>
                <Home className="link-icon" />
                <span>Home Loans</span>
              </div>
              <div className="link-card" onClick={handleLogin}>
                <Car className="link-icon" />
                <span>Car Loan</span>
              </div>
              <div className="link-card" onClick={handleLogin}>
                <Gem className="link-icon" />
                <span>Gold Loan</span>
              </div>
              <div className="link-card" onClick={handleLogin}>
                <Percent className="link-icon" />
                <span>Deposit Rates</span>
              </div>
              <div className="link-card" onClick={handleLogin}>
                <Building2 className="link-icon" />
                <span>Corporate</span>
              </div>
              <div className="link-card" onClick={handleLogin}>
                <CreditCard className="link-icon" />
                <span>Credit Cards</span>
              </div>
              <div className="link-card" onClick={handleLogin}>
                <Landmark className="link-icon" />
                <span>Govt Schemes</span>
              </div>
              <div className="link-card" onClick={handleLogin}>
                <FileText className="link-icon" />
                <span>Downloads</span>
              </div>
            </div>
          </section>

          <section className="ancillary-products">
            <h2 className="section-title">Ancillary Products</h2>
            <div className="products-carousel">
              <div className="product-card" onClick={handleLogin}>Lockers</div>
              <div className="product-card" onClick={handleLogin}>Insurance</div>
              <div className="product-card" onClick={handleLogin}>Pension System</div>
              <div className="product-card" onClick={handleLogin}>Trading Services</div>
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
              <button className="apply-btn" onClick={handleLogin}>Apply Now!</button>
            </div>
            <div className="rate-row">
              <span className="rate-name">Car Loan</span>
              <span className="rate-value">7.45% P.A*</span>
              <button className="apply-btn" onClick={handleLogin}>Apply Now!</button>
            </div>
            <div className="rate-row">
              <span className="rate-name">Gold Loan</span>
              <span className="rate-value">8.50% P.A*</span>
              <button className="apply-btn" onClick={handleLogin}>Apply Now!</button>
            </div>
            <div className="rate-row">
              <span className="rate-name">Deposit Schemes</span>
              <span className="rate-value">7.15% P.A*</span>
              <button className="apply-btn blue" onClick={handleLogin}>Know More</button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-columns">
          <div className="footer-col">
            <h3>Disclosure</h3>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Basel II Disclosure</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>ESG Disclosures</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>RTI</a>
          </div>
          <div className="footer-col">
            <h3>Compliance</h3>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Citizen Charter</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Complaint Mechanism</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Important Policies</a>
          </div>
          <div className="footer-col">
            <h3>Important Links</h3>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>KYC Compliance Check</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Wilful Defaulters</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Verify CheckSum Value</a>
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
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Disclaimer</a> | <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Privacy Policy</a> | <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>Terms & Conditions</a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showMapModal && (
        <div className="modal-overlay" onClick={() => setShowMapModal(false)}>
          <div className="modal-content map-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowMapModal(false)}>×</button>
            <h2>Branch / ATM Locator</h2>
            <div className="globe-container" style={{ width: '100%', height: '100%', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
              <ReactGlobe
                ref={globeEl}
                width={globeSize.width}
                height={globeSize.height}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                htmlElementsData={dbBranches}
                htmlElement={d => {
                  const el = document.createElement('div');
                  el.innerHTML = `
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="#EA4335" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3" fill="white"></circle>
                    </svg>
                    <div style="color: white; font-size: 13px; font-weight: bold; background: rgba(0,0,0,0.7); padding: 4px 8px; border-radius: 4px; white-space: nowrap; transform: translate(-50%, 5px); margin-left: 16px;">
                      ${d.name}<br/><span style="font-size: 10px; font-weight: normal;">${d.location || ''}</span>
                    </div>
                  `;
                  el.style.display = 'flex';
                  el.style.flexDirection = 'column';
                  el.style.alignItems = 'center';
                  el.style.pointerEvents = 'none';
                  return el;
                }}
                backgroundColor="#0a0a0a"
              />
            </div>
          </div>
        </div>
      )}

      {showHelplineModal && (
        <div className="modal-overlay" onClick={() => setShowHelplineModal(false)}>
          <div className="modal-content info-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowHelplineModal(false)}>×</button>
            <h2>24/7 Helpline & Support</h2>
            <div className="helpline-info">
              <p>Welcome to Bank of Captcha Support. We are here to assist you.</p>
              <div className="contact-details">
                <div className="contact-row"><Phone size={20} /> <strong>Toll-Free:</strong> 1800-CAPTCHA-BANK (1800-227-8242)</div>
                <div className="contact-row"><Mail size={20} /> <strong>Email:</strong> support@bankofcaptcha.com</div>
                <div className="contact-row"><Globe size={20} /> <strong>International:</strong> +91-22-6666-8888</div>
              </div>
              <p className="note">For immediate blocking of lost/stolen debit cards, please press 1 on the IVR.</p>
              <button className="apply-btn" onClick={() => setShowHelplineModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );};

export default Landing;
