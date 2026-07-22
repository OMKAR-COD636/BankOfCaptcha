import re

with open('src/pages/Landing.jsx', 'r') as f:
    content = f.read()

# Add imports for modal and globe
imports_to_add = """import ReactGlobe from 'react-globe.gl';
import { useRef } from 'react';
"""

content = content.replace("import React, { useState, useEffect } from 'react';", 
                          "import React, { useState, useEffect, useRef } from 'react';\nimport ReactGlobe from 'react-globe.gl';")

# Add state variables inside Landing component
state_vars = """  const [currentBanner, setCurrentBanner] = useState(0);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showHelplineModal, setShowHelplineModal] = useState(false);
  const globeEl = useRef();
  
  useEffect(() => {
    if (showMapModal && globeEl.current) {
      // Zoom to India after a short delay
      setTimeout(() => {
        globeEl.current.pointOfView({ lat: 20.5937, lng: 78.9629, altitude: 0.8 }, 2000);
      }, 500);
    }
  }, [showMapModal]);

  const branchLocations = [
    { lat: 19.0760, lng: 72.8777, name: 'Mumbai Branch', size: 0.1, color: 'red' },
    { lat: 28.7041, lng: 77.1025, name: 'Delhi Branch', size: 0.1, color: 'red' },
    { lat: 12.9716, lng: 77.5946, name: 'Bangalore Branch', size: 0.1, color: 'red' },
    { lat: 13.0827, lng: 80.2707, name: 'Chennai Branch', size: 0.1, color: 'red' },
    { lat: 22.5726, lng: 88.3639, name: 'Kolkata Branch', size: 0.1, color: 'red' },
    { lat: 17.3850, lng: 78.4867, name: 'Hyderabad Branch', size: 0.1, color: 'red' },
    { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad Branch', size: 0.1, color: 'red' },
    { lat: 18.5204, lng: 73.8567, name: 'Pune Branch', size: 0.1, color: 'red' },
  ];
"""
content = content.replace("const [currentBanner, setCurrentBanner] = useState(0);", state_vars)

# Helper function to replace generic links
content = content.replace('<a href="#">', '<a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>')
content = content.replace('className="link-card"', 'className="link-card" onClick={handleLogin}')
content = content.replace('className="product-card"', 'className="product-card" onClick={handleLogin}')
content = content.replace('className="apply-btn"', 'className="apply-btn" onClick={handleLogin}')
content = content.replace('className="apply-btn blue"', 'className="apply-btn blue" onClick={handleLogin}')

# Fix the quick actions strip specifically
quick_actions_original = """      <div className="quick-actions-strip">
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}><Globe size={16} /> Online SB Account</a>
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}><User size={16} /> Investor Relations</a>
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}><MapPin size={16} /> Branch/ATM Locator</a>
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}><HelpCircle size={16} /> Helpline</a>
      </div>"""

quick_actions_new = """      <div className="quick-actions-strip">
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}><Globe size={16} /> Online SB Account</a>
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}><User size={16} /> Investor Relations</a>
        <a href="#" onClick={(e) => { e.preventDefault(); setShowMapModal(true); }}><MapPin size={16} /> Branch/ATM Locator</a>
        <a href="#" onClick={(e) => { e.preventDefault(); setShowHelplineModal(true); }}><HelpCircle size={16} /> Helpline</a>
      </div>"""
content = content.replace(quick_actions_original, quick_actions_new)


# Modals markup to add at the end of the return statement
modals_markup = """
      {/* Modals */}
      {showMapModal && (
        <div className="modal-overlay" onClick={() => setShowMapModal(false)}>
          <div className="modal-content map-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowMapModal(false)}>×</button>
            <h2>Branch / ATM Locator</h2>
            <div className="globe-container" style={{ width: '100%', height: '400px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
              <ReactGlobe
                ref={globeEl}
                width={Math.min(window.innerWidth * 0.8, 800) - 40}
                height={400}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                labelsData={branchLocations}
                labelLat={d => d.lat}
                labelLng={d => d.lng}
                labelText={d => d.name}
                labelSize={d => d.size}
                labelDotRadius={d => d.size}
                labelColor={() => 'rgba(255, 165, 0, 0.75)'}
                labelResolution={2}
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
  );"""

content = content.replace("    </div>\n  );\n", modals_markup)

with open('src/pages/Landing.jsx', 'w') as f:
    f.write(content)

print("Patched Landing.jsx")
