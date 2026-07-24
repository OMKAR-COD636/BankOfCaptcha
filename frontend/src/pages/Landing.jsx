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
import { useTranslation } from '../i18n/LanguageContext';
import useAuth from '../hooks/useAuth';
import logoUrl from '../assets/logo.svg';

const Landing = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showHelplineModal, setShowHelplineModal] = useState(false);
  const globeEl = useRef();
  const [globeSize, setGlobeSize] = useState({ width: 800, height: 400 });
  const auth = useAuth();

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
      setTimeout(() => {
        globeEl.current.pointOfView({ lat: 20.5937, lng: 78.9629, altitude: 0.8 }, 2000);
      }, 500);
    }
  }, [showMapModal]);

  const [dbBranches, setDbBranches] = useState([]);

  useEffect(() => {
    const fallbackLocations = [
      { lat: 19.0760, lng: 76.8777, name: 'Mumbai Branch', location: 'Mumbai', id: 1 },
      { lat: 18.5204, lng: 77.8567, name: 'Pune Branch', location: 'Pune', id: 2 },
      { lat: 28.7041, lng: 77.1025, name: 'Delhi Branch', location: 'Delhi', id: 3 },
      { lat: 22.5726, lng: 88.3639, name: 'Kolkata Branch', location: 'Kolkata', id: 4 },
    ];
    setDbBranches(fallbackLocations);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % 2); // 2 banners
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Log out user if they navigate back to the landing page
  useEffect(() => {
    if (auth.isAuthenticated) {
      auth.logout();
    }
  }, [auth.isAuthenticated, auth.logout]);

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const handleLogin = () => navigate('/login');

  return (
    <div className="landing-container">
      <div className="utility-bar">
        <div className="utility-left">
          <span className="contact-item"><Phone size={14} /> {t('landing.tollFree')}: 1800-CAPTCHA-BANK</span>
          <span className="contact-item"><Mail size={14} /> {t('landing.supportEmail')}</span>
        </div>
        <div className="utility-right">
          <span className="lang-switcher">
            <span style={{cursor: 'pointer', fontWeight: language === 'en' ? 'bold' : 'normal'}} onClick={() => setLanguage('en')}>{t('landing.langEn')}</span> | 
            <span style={{cursor: 'pointer', fontWeight: language === 'hi' ? 'bold' : 'normal'}} onClick={() => setLanguage('hi')}> {t('landing.langHi')}</span> | 
            <span style={{cursor: 'pointer', fontWeight: language === 'mr' ? 'bold' : 'normal'}} onClick={() => setLanguage('mr')}> {t('landing.langMr')}</span>
          </span>
          <DarkModeToggle variant="standalone" />
        </div>
      </div>

      <header className="main-header">
        <div className="logo-container">
          <img src={logoUrl} alt="Bank Of Captcha Logo" className="logo-icon" width="32" height="32" />
          <div className="logo-text">
            <h1>{t('landing.bankName')}</h1>
            <span>{t('landing.tagline')}</span>
          </div>
        </div>
        
        <nav className="primary-nav">
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.nav.personal')}</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.nav.corporate')}</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.nav.msme')}</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.nav.agriculture')}</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.nav.digitalBanking')}</a>
          <button className="login-btn" onClick={handleLogin}>
            {t('landing.nav.login')} <ChevronRight size={16} />
          </button>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <h2>{t(`landing.banners.${currentBanner}.title`)}</h2>
          <p>{t(`landing.banners.${currentBanner}.subtitle`)}</p>
          <button
            className={`hero-cta ${currentBanner === 1 ? 'hero-cta-pqc-solid' : ''}`}
            onClick={() => navigate(currentBanner === 0 ? '/demo?tab=insider' : '/demo?tab=pqc')}
          >
            {t(`landing.banners.${currentBanner}.cta`)}
          </button>
        </div>
        <div className="carousel-dots">
          {[0, 1].map((idx) => (
            <span 
              key={idx} 
              className={`dot ${idx === currentBanner ? 'active' : ''}`}
              onClick={() => setCurrentBanner(idx)}
            />
          ))}
        </div>
      </section>

      <div className="quick-actions-strip">
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}><Globe size={16} /> {t('landing.quickActions.sbAccount')}</a>
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}><User size={16} /> {t('landing.quickActions.investor')}</a>
        <a href="#" onClick={(e) => { e.preventDefault(); setShowMapModal(true); }}><MapPin size={16} /> {t('landing.quickActions.locator')}</a>
        <a href="#" onClick={(e) => { e.preventDefault(); setShowHelplineModal(true); }}><HelpCircle size={16} /> {t('landing.quickActions.helpline')}</a>
      </div>

      <div className="news-ticker">
        <div className="ticker-label">
          <span className="badge">{t('landing.news.new')}</span> {t('landing.news.whatsNew')}
        </div>
        <div className="ticker-content-wrapper">
          <div className="ticker-content">
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.news.items.0')}</a>
            <span className="divider">|</span>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.news.items.1')}</a>
            <span className="divider">|</span>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.news.items.2')}</a>
          </div>
        </div>
      </div>

      <div className="main-layout">
        <div className="content-area">
          <section className="quick-links-section">
            <h2 className="section-title">{t('landing.quickLinks.title')}</h2>
            <div className="quick-links-grid">
              <div className="link-card" onClick={handleLogin}>
                <Home className="link-icon" /><span>{t('landing.quickLinks.homeLoans')}</span>
              </div>
              <div className="link-card" onClick={handleLogin}>
                <Car className="link-icon" /><span>{t('landing.quickLinks.carLoan')}</span>
              </div>
              <div className="link-card" onClick={handleLogin}>
                <Gem className="link-icon" /><span>{t('landing.quickLinks.goldLoan')}</span>
              </div>
              <div className="link-card" onClick={handleLogin}>
                <Percent className="link-icon" /><span>{t('landing.quickLinks.depositRates')}</span>
              </div>
              <div className="link-card" onClick={handleLogin}>
                <Building2 className="link-icon" /><span>{t('landing.quickLinks.corporate')}</span>
              </div>
              <div className="link-card" onClick={handleLogin}>
                <CreditCard className="link-icon" /><span>{t('landing.quickLinks.creditCards')}</span>
              </div>
              <div className="link-card" onClick={handleLogin}>
                <Landmark className="link-icon" /><span>{t('landing.quickLinks.govtSchemes')}</span>
              </div>
              <div className="link-card" onClick={handleLogin}>
                <FileText className="link-icon" /><span>{t('landing.quickLinks.downloads')}</span>
              </div>
            </div>
          </section>

          <section className="ancillary-products">
            <h2 className="section-title">{t('landing.ancillary.title')}</h2>
            <div className="products-carousel">
              <div className="product-card" onClick={handleLogin}>{t('landing.ancillary.lockers')}</div>
              <div className="product-card" onClick={handleLogin}>{t('landing.ancillary.insurance')}</div>
              <div className="product-card" onClick={handleLogin}>{t('landing.ancillary.pension')}</div>
              <div className="product-card" onClick={handleLogin}>{t('landing.ancillary.trading')}</div>
            </div>
          </section>
        </div>

        <div className="sidebar">
          <div className="sidebar-tabs">
            <div className="tab active">{t('landing.sidebar.tabs.rates')}</div>
            <div className="tab">{t('landing.sidebar.tabs.apply')}</div>
            <div className="tab">{t('landing.sidebar.tabs.calculators')}</div>
          </div>
          <div className="sidebar-content">
            {[0,1,2,3].map(i => (
              <div className="rate-row" key={i}>
                <span className="rate-name">{t(`landing.sidebar.rates.${i}.name`)}</span>
                <span className="rate-value">{t(`landing.sidebar.rates.${i}.value`)}</span>
                <button className={`apply-btn ${i===3?'blue':''}`} onClick={handleLogin}>
                  {i===3 ? t('landing.sidebar.knowMore') : t('landing.sidebar.applyNow')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="main-footer">
        <div className="footer-columns">
          <div className="footer-col">
            <h3>{t('landing.footer.disclosure')}</h3>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.footer.basel')}</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.footer.esg')}</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.footer.rti')}</a>
          </div>
          <div className="footer-col">
            <h3>{t('landing.footer.compliance')}</h3>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.footer.citizen')}</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.footer.complaint')}</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.footer.policies')}</a>
          </div>
          <div className="footer-col">
            <h3>{t('landing.footer.links')}</h3>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.footer.kyc')}</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.footer.defaulters')}</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.footer.checksum')}</a>
          </div>
          <div className="footer-col">
            <h3>{t('landing.footer.contact')}</h3>
            <p dangerouslySetInnerHTML={{__html: t('landing.footer.address')}}></p>
          </div>
        </div>
        
        <div className="security-banner">
          <strong>{t('landing.footer.securityBanner').split(':')[0]}:</strong> {t('landing.footer.securityBanner').substring(t('landing.footer.securityBanner').indexOf(':')+1)}
        </div>
        
        <div className="footer-bottom">
          <div className="copyright">{t('landing.footer.copyright')}</div>
          <div className="footer-links">
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.footer.disclaimer')}</a> | <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.footer.privacy')}</a> | <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>{t('landing.footer.terms')}</a>
          </div>
        </div>
      </footer>

      {showMapModal && (
        <div className="modal-overlay" onClick={() => setShowMapModal(false)}>
          <div className="modal-content map-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowMapModal(false)}>×</button>
            <h2>{t('landing.modals.locator')}</h2>
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
            <h2>{t('landing.modals.helplineTitle')}</h2>
            <div className="helpline-info">
              <p>{t('landing.modals.helplineWelcome')}</p>
              <div className="contact-details">
                <div className="contact-row"><Phone size={20} /> <strong>{t('landing.modals.tollFreeLabel')}</strong> 1800-CAPTCHA-BANK (1800-227-8242)</div>
                <div className="contact-row"><Mail size={20} /> <strong>{t('landing.modals.emailLabel')}</strong> support@bankofcaptcha.com</div>
                <div className="contact-row"><Globe size={20} /> <strong>{t('landing.modals.intlLabel')}</strong> +91-22-6666-8888</div>
              </div>
              <p className="note">{t('landing.modals.note')}</p>
              <button className="apply-btn" onClick={() => setShowHelplineModal(false)}>{t('landing.modals.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
