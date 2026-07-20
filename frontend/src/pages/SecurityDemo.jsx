import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SecurityDemo.css';

/* ── Attack definitions ── */
const ATTACKS = [
  {
    id: 'teller-low',
    role: 'TELLER',
    risk: 'low',
    icon: '🎯',
    name: 'Teller Smurfing (Insider)',
    desc: 'A rogue teller siphons small amounts below detection thresholds — classic financial structuring.',
    script: 'generate_teller_traffic.py',
    steps: [
      { type:'attack', emoji:'👤', title:'Rogue Teller Logs In', desc:'Teller "raghav" authenticates with valid credentials. Access appears normal.' },
      { type:'attack', emoji:'💸', title:'Smurfing: 15 Micro-Transfers', desc:'₹10–₹50 transfers fired at 50ms intervals. Each looks innocent in isolation.', packet: { type:'smurf' } },
      { type:'detect', emoji:'🧠', title:'LSTM Sequence Anomaly Detected', desc:'The autoencoder sees pattern [3,3,3,3,3,3...]. Reconstruction error spikes to 1.42 — far above 0.8 threshold.' },
      { type:'detect', emoji:'📊', title:'Statistical Profiler Flags Frequency', desc:'15 transfers in <1 second. Z-score: 4.7σ above teller baseline. CRITICAL alert fired.' },
      { type:'defend', emoji:'🔒', title:'System Response: Account Suspended', desc:'Backend sets access_suspended=true for the teller. All subsequent JWT requests return 403.' },
    ],
    recommendations: [
      'Review all transactions initiated by this teller in the last 30 days.',
      'Enable 2-person verification for transfers even below ₹10,000.',
      'Schedule immediate interview with branch compliance officer.',
      'Cross-check destination accounts for connected-party relationships.',
    ]
  },
  {
    id: 'manager-low',
    role: 'BRANCH MANAGER',
    risk: 'low',
    icon: '🕵️',
    name: 'Manager Approval Smurfing',
    desc: 'Manager blindly bulk-approves every pending transfer request without reviewing details.',
    script: 'generate_manager_traffic.py',
    steps: [
      { type:'attack', emoji:'👔', title:'Manager Authenticates', desc:'Branch Manager "priya" logs in — role appears legitimate.' },
      { type:'attack', emoji:'✅', title:'Blind Mass Approvals: 16 Requests', desc:'Manager approves request IDs 1 & 2 in a tight loop 8 times without reviewing amounts or destinations.' },
      { type:'detect', emoji:'🧠', title:'LSTM Detects Repetitive Pattern', desc:'Sequence [APPROVE, APPROVE, APPROVE...] triggers autoencoder. MSE: 1.18 > threshold 0.8.' },
      { type:'detect', emoji:'⚠️', title:'Role-Action Anomaly: No Review Steps', desc:'Normal manager workflow: FETCH_REQUESTS → REVIEW → APPROVE. Interceptor sees only APPROVE chains.' },
      { type:'defend', emoji:'🚨', title:'CRITICAL Alert Raised to SuperAdmin', desc:'AI engine fires alert. SuperAdmin notified. Manager flagged for review.' },
    ],
    recommendations: [
      'Mandate a minimum review delay of 10 seconds per approval.',
      'Require managers to open transaction detail view before approving.',
      'Alert on any bulk-approval pattern exceeding 5 requests/minute.',
      'Log all approval actions with destination account summaries for audit.',
    ]
  },
  {
    id: 'teller-med',
    role: 'TELLER',
    risk: 'medium',
    icon: '🧨',
    name: 'KYC Fraud Injection',
    desc: 'A rogue teller mass-submits fake KYC applications to create mule accounts for money laundering.',
    script: 'generate_teller_traffic.py',
    steps: [
      { type:'attack', emoji:'📋', title:'Teller Begins Fake KYC Flood', desc:'10 synthetic KYC submissions in <1 second. Each uses randomised Aadhaar & mobile numbers.' },
      { type:'attack', emoji:'🤖', title:'Fabricated Identities Submitted', desc:'Payload: fullName="Test User 4821", aadhaar=random 12-digit, email=test@example.com. No real person.' },
      { type:'detect', emoji:'📈', title:'Frequency Anomaly: 10 KYC/min', desc:'Baseline: 1–2 KYC approvals per hour. Statistical profiler flags 10x deviation. Alert triggered.' },
      { type:'detect', emoji:'🧠', title:'LSTM: Unnatural Repetition', desc:'Normal sequence varies actions. LSTM sees [KYC, KYC, KYC...] — MSE 1.31, CRITICAL threshold breached.' },
      { type:'defend', emoji:'🔒', title:'Teller Suspended, KYC Queue Frozen', desc:'All pending KYC requests from this teller flagged SUSPICIOUS. SuperAdmin review required.' },
    ],
    recommendations: [
      'Implement rate limiting: max 5 KYC submissions per teller per hour.',
      'Cross-validate Aadhaar numbers with UIDAI lookup before acceptance.',
      'Require supervisor co-signature for any KYC batch submission.',
      'Audit all accounts created from suspicious KYC applications.',
    ]
  },
  {
    id: 'manager-med',
    role: 'BRANCH MANAGER',
    risk: 'medium',
    icon: '💰',
    name: 'Unilateral ₹1M Transfer',
    desc: 'Manager initiates a massive ₹10,00,000 transfer — bypassing maker-checker by exploiting a timing window.',
    script: 'generate_manager_traffic.py',
    steps: [
      { type:'attack', emoji:'💳', title:'Manager Initiates ₹1,000,000 Transfer', desc:'POST /api/transactions/transfer with amount=1000000. Maker-checker route triggered.' },
      { type:'detect', emoji:'📊', title:'Statistical Profiler: Z-score 6.2σ', desc:'Manager baseline average: ₹12,000. This transfer is 83x the expected amount. Extreme outlier flagged.' },
      { type:'detect', emoji:'🧠', title:'LSTM: Amount Embedding Anomaly', desc:'Amount encoded as feature vector. Autoencoder reconstruction error: 1.89 (highest recorded). Immediate CRITICAL alert.' },
      { type:'defend', emoji:'🚫', title:'Transaction Halted in Maker-Checker Queue', desc:'Transfer amount ≥₹10,000 auto-routes to approval queue. SuperAdmin intervenes before execution.' },
      { type:'defend', emoji:'📜', title:'PQC-Signed Audit Trail Created', desc:'Every action ML-KEM encrypted + ML-DSA signed. Tamper-proof evidence chain preserved.' },
    ],
    recommendations: [
      'Require dual-manager approval for any single transfer exceeding ₹5,00,000.',
      'Send real-time SMS/email alert to branch head for transfers >₹1,00,000.',
      'Implement cooling-off period: 30-minute delay for transfers >₹5,00,000.',
      'Verify destination account ownership against CRM records before approval.',
    ]
  },
  {
    id: 'teller-high',
    role: 'TELLER',
    risk: 'high',
    icon: '💀',
    name: 'Privilege Escalation Attack',
    desc: 'Teller probes admin endpoints attempting to read AI alerts, audit logs, and contain other users.',
    script: 'generate_teller_traffic.py',
    steps: [
      { type:'attack', emoji:'🔍', title:'Teller Probes Admin Endpoints', desc:'5 rapid GET /api/ai/alerts requests from teller token. Spring Security returns 403 each time.' },
      { type:'attack', emoji:'⛔', title:'Unauthorised Audit Log Access Attempt', desc:'GET /api/audit/logs attempted. AuditInterceptor logs the 403 event — attacker unknowingly leaves evidence.' },
      { type:'detect', emoji:'🧠', title:'LSTM: Role-Category Violation', desc:'TELLER role should never call ADMIN category endpoints. Sequence [ADMIN, ADMIN, ADMIN...] MSE: 1.61.' },
      { type:'detect', emoji:'🚨', title:'CRITICAL: Lateral Movement Pattern', desc:'5 admin probes in <1s classified as reconnaissance. Insider threat confidence: 98.4%.' },
      { type:'defend', emoji:'🔐', title:'Teller Access Immediately Suspended', desc:'JWT invalidated. All sessions terminated. Incident ticket auto-created in audit log.' },
    ],
    recommendations: [
      'Immediately escalate to CISO — this indicates a compromised or malicious insider.',
      'Forensically image the teller workstation before any further action.',
      'Review all actions performed by this teller for the past 90 days.',
      'File a SAR (Suspicious Activity Report) with RBI within 24 hours.',
    ]
  },
  {
    id: 'manager-high',
    role: 'BRANCH MANAGER',
    risk: 'high',
    icon: '🔥',
    name: 'Manager Alert Tampering',
    desc: 'Manager attempts to contain/silence AI security alerts — covering tracks of ongoing fraud.',
    script: 'generate_manager_traffic.py',
    steps: [
      { type:'attack', emoji:'🗑️', title:'Manager Calls Alert Containment API', desc:'POST /api/admin/alerts/1/contain fired 5 times. This endpoint is SUPER_ADMIN only — all return 403.' },
      { type:'detect', emoji:'🧠', title:'LSTM: Forbidden Action Sequence Detected', desc:'Branch Manager attempting SUPER_ADMIN actions. Pattern classified as evidence-tampering. MSE: 1.73.' },
      { type:'detect', emoji:'📡', title:'Correlation: Manager Under Active Investigation', desc:'AI cross-references: this manager has 3 prior anomaly flags this week. Pattern escalates to HIGH threat.' },
      { type:'defend', emoji:'🛡️', title:'PQC Log Integrity Preserved', desc:'Attempted tampering failed. All alerts ML-DSA signed — any modification invalidates signature. Evidence intact.' },
      { type:'defend', emoji:'⛔', title:'Manager Account Suspended, CISO Alerted', desc:'Immediate suspension. Immutable audit chain handed to compliance team for investigation.' },
    ],
    recommendations: [
      'Treat as coordinated insider fraud — escalate to law enforcement if losses confirmed.',
      'Cryptographically verify all recent audit logs for tampering signatures.',
      'Conduct emergency branch audit — review all approvals by this manager.',
      'Rotate all PQC keys as a precaution and re-sign existing audit evidence.',
    ]
  },
];

const PQC_DEMOS = [
  {
    id: 'sniff',
    cls: 'mlkem',
    icon: '📡',
    badge: 'ML-KEM-768',
    name: 'Packet Sniffing Attack',
    desc: 'An attacker intercepts encrypted banking traffic and attempts to decode it using quantum-era rainbow tables. Protected by ML-KEM.',
    steps: [
      { type:'attack', emoji:'📡', title:'Attacker Deploys Network Sniffer', desc:'Wireshark-style tool placed on bank network segment. Begins capturing all TCP packets between client and server.' },
      { type:'attack', emoji:'📦', title:'Transaction Packet Captured', desc:'Attacker intercepts POST /api/transactions/transfer. Raw bytes visible.', packet: { type:'encrypted' } },
      { type:'attack', emoji:'⚛️', title:'Quantum Decryption Attempted', desc:'Attacker uses Shor\'s algorithm variant + rainbow tables against RSA-2048. For classical encryption, this would succeed in ~hours.' },
      { type:'defend', emoji:'🔮', title:'ML-KEM-768 Blocks Decryption', desc:'Payload encrypted with AES-256-GCM key derived via ML-KEM-768 KEM. The encapsulation is quantum-resistant — Grover\'s algorithm provides no speedup against KEM lattice problems.', packet: { type:'gibberish' } },
      { type:'defend', emoji:'✅', title:'Attacker Sees Only Gibberish', desc:'Even with quantum computing, the ciphertext cannot be decrypted. KEM encapsulation safely stored in DB.' },
    ],
    recommendations: [
      'ML-KEM-768 (CRYSTALS-Kyber) is NIST FIPS 203 standardised — quantum safe.',
      'AES-256-GCM symmetric key is never transmitted in plaintext.',
      'KEM encapsulation stored separately — compromise of one record doesn\'t expose others.',
      'Rotate ML-KEM key pairs quarterly as per NIST post-quantum guidelines.',
    ]
  },
  {
    id: 'mitm',
    cls: 'mldsa',
    icon: '🔄',
    badge: 'ML-DSA-65',
    name: 'Man-in-the-Middle Attack',
    desc: 'An attacker intercepts and modifies packets mid-transit, trying to alter transaction amounts. Stopped by ML-DSA signatures.',
    steps: [
      { type:'attack', emoji:'🕵️', title:'MITM Positions Between Client & Server', desc:'Attacker performs ARP spoofing to route traffic through their machine. They can read and modify packets.' },
      { type:'attack', emoji:'✏️', title:'Attacker Alters Transaction Amount', desc:'Packet intercepted. Attacker changes amount field from "5000" to "500000" hoping to profit.', packet: { type:'tampered' } },
      { type:'attack', emoji:'📤', title:'Forged Packet Forwarded to Server', desc:'Modified packet relayed to backend. Without signing, this would succeed silently.' },
      { type:'defend', emoji:'🔏', title:'ML-DSA-65 Signature Verification Fails', desc:'AuditInterceptor verifies ML-DSA signature on every action. The modified payload produces a completely different signature hash — mismatch detected instantly.', packet: { type:'sig-fail' } },
      { type:'defend', emoji:'🚨', title:'Request Rejected, MITM Attack Logged', desc:'Backend rejects tampered request with 400. Incident logged with full PQC audit trail. Attacker\'s attempt is cryptographically recorded.' },
    ],
    recommendations: [
      'ML-DSA-65 (CRYSTALS-Dilithium) is NIST FIPS 204 standardised — quantum safe signing.',
      'Every audit log entry is individually signed — forging one record is computationally infeasible.',
      'Combine with TLS 1.3 for defence-in-depth against network-level attacks.',
      'Implement certificate pinning on the frontend to block proxy-based MITM.',
    ]
  }
];

/* ── Packet Visualizer ── */
function PacketVis({ type }) {
  if (type === 'smurf') return (
    <div className="packet-vis">
      {[42,17,35,28,49,11,39].map((v,i) => (
        <div key={i} className="packet-row" style={{animationDelay:`${i*0.1}s`}}>
          <span className="pf-label">T+{(i*50)}ms</span>
          <span className="pf-normal">POST /transfer</span>
          <span className="pf-normal">src:10000001</span>
          <span className="pf-key">₹{v}</span>
        </div>
      ))}
    </div>
  );
  if (type === 'encrypted') return (
    <div className="packet-vis">
      <div className="packet-row"><span className="pf-label">RAW:</span><span className="pf-normal">POST /api/transactions/transfer</span></div>
      <div className="packet-row"><span className="pf-label">Body:</span><span className="pf-cipher">AES256-GCM:a8f3c2d1e9b7...4f2a</span></div>
      <div className="packet-row"><span className="pf-label">KEM:</span><span className="pf-key">ML-KEM-768:encap_0x7f2b...</span></div>
    </div>
  );
  if (type === 'gibberish') return (
    <div className="packet-vis">
      <div className="packet-row"><span className="pf-label">Quantum decode attempt:</span></div>
      <div className="packet-row"><span className="pf-cipher">3f8a2c1d9b4e7f0a1c3d5e7f9a0b2c4d</span></div>
      <div className="packet-row"><span className="pf-cipher">a1b3c5d7e9f0a2b4c6d8e0f1a3b5c7d9</span></div>
      <div className="packet-row" style={{marginTop:6}}><span className="pf-new">⚠ Decryption failed — lattice problem unsolvable</span></div>
    </div>
  );
  if (type === 'tampered') return (
    <div className="packet-vis">
      <div className="packet-row"><span className="pf-label">Original:</span><span className="pf-normal">amount: "5000"</span></div>
      <div className="packet-row"><span className="pf-label">Tampered:</span><span className="pf-tampered">amount: "5000"</span><span className="pf-new">amount: "500000"</span></div>
      <div className="packet-row"><span className="pf-label">Sig:</span><span className="pf-key">ML-DSA:3e7f1a...</span><span className="pf-new">[now invalid]</span></div>
    </div>
  );
  if (type === 'sig-fail') return (
    <div className="packet-vis">
      <div className="packet-row"><span className="pf-label">Expected sig:</span><span className="pf-key">3e7f1a2b9c...</span></div>
      <div className="packet-row"><span className="pf-label">Computed sig:</span><span className="pf-tampered">9d4b2c7f1e...</span></div>
      <div className="packet-row" style={{marginTop:6}}><span className="pf-new">✗ ML-DSA verification FAILED — request rejected</span></div>
    </div>
  );
  return null;
}

/* ── Step Row ── */
function StepRow({ step, index, visible, isLast, connectorLit }) {
  const typeMap = {
    attack: { dotCls:'attack', labelCls:'attack-col', cardCls:'attack-style', label:'ATTACK' },
    detect: { dotCls:'active', labelCls:'info-col',   cardCls:'active',       label:'DETECTION' },
    defend: { dotCls:'defend', labelCls:'defend-col', cardCls:'defend-style', label:'SYSTEM RESPONSE' },
    warn:   { dotCls:'warn',   labelCls:'warn-col',   cardCls:'warn-style',   label:'WARNING' },
  };
  const m = typeMap[step.type] || typeMap.detect;
  return (
    <div className={`pipeline-step${visible ? ' visible' : ''}`} style={{ transitionDelay: `${index * 0.15}s` }}>
      <div className="step-line-col">
        <div className={`step-dot ${m.dotCls}`}>{step.emoji}</div>
        {!isLast && <div className={`step-connector${connectorLit ? ' lit' : ''}`} />}
      </div>
      <div className="step-content">
        <div className={`step-content-inner ${m.cardCls}`}>
          <div className={`step-label ${m.labelCls}`}>{m.label}</div>
          <div className="step-title">{step.title}</div>
          <div className="step-desc">{step.desc}</div>
          {step.packet && <PacketVis type={step.packet.type} />}
        </div>
      </div>
    </div>
  );
}

/* ── Pipeline Modal ── */
function PipelineModal({ attack, onClose }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showRecs, setShowRecs] = useState(false);
  const steps = attack.steps;

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= steps.length) {
        clearInterval(iv);
        setTimeout(() => setShowRecs(true), 400);
      }
    }, 900);
    return () => clearInterval(iv);
  }, [steps.length]);

  return (
    <div className="pipeline-overlay" onClick={onClose}>
      <div className="pipeline-modal" onClick={e => e.stopPropagation()}>
        <div className="pipeline-modal-header">
          <h2>{attack.icon} {attack.name}</h2>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="pipeline-body">
          <div className="pipeline-steps">
            {steps.map((step, i) => (
              <StepRow
                key={i}
                step={step}
                index={i}
                visible={i < visibleCount}
                isLast={i === steps.length - 1}
                connectorLit={i + 1 < visibleCount}
              />
            ))}
          </div>
          {showRecs && (
            <div className="recommendations-box">
              <h4>🛡️ Recommended Admin Actions</h4>
              <ul>
                {attack.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
          {!showRecs && visibleCount < steps.length && (
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:16, color:'#64748b', fontSize:13 }}>
              <div className="loader-dots">
                <div className="loader-dot" /><div className="loader-dot" /><div className="loader-dot" />
              </div>
              Simulating attack pipeline…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Attack Card ── */
function AttackCard({ attack, onRun }) {
  const riskMap = { low:'low', medium:'med', high:'high' };
  const r = riskMap[attack.risk];
  return (
    <div className={`attack-card risk-${attack.risk}`} onClick={onRun}>
      <div className="attack-card-header">
        <div className={`attack-card-icon ${r}`}>{attack.icon}</div>
        <span className={`risk-badge ${r}`}>{attack.risk} risk</span>
      </div>
      <div className="attack-card-role">{attack.role}</div>
      <h3>{attack.name}</h3>
      <p>{attack.desc}</p>
      <button className="simulate-btn" onClick={e => { e.stopPropagation(); onRun(); }}>
        ▶ Simulate Attack
      </button>
    </div>
  );
}

/* ── PQC Card ── */
function PQCCard({ demo, onRun }) {
  return (
    <div className={`pqc-card ${demo.cls}`} onClick={onRun}>
      <div className="pqc-badge">{demo.icon} {demo.badge}</div>
      <h3>{demo.name}</h3>
      <p>{demo.desc}</p>
      <button className="simulate-btn" onClick={e => { e.stopPropagation(); onRun(); }}>
        ▶ Simulate Attack
      </button>
    </div>
  );
}

/* ── Main Page ── */
export default function SecurityDemo() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(() => {
    const p = new URLSearchParams(location.search).get('tab');
    return (p === 'pqc') ? 'pqc' : 'insider';
  });
  const [active, setActive] = useState(null);

  const openModal = useCallback((item) => setActive(item), []);
  const closeModal = useCallback(() => setActive(null), []);

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [closeModal]);

  return (
    <div className="demo-root">
      <header className="demo-header">
        <div className="demo-header-brand">
          🛡️ BankOfCaptcha — Security Lab
        </div>
        <button className="demo-header-back" onClick={() => navigate('/')}>
          ← Back to Portal
        </button>
      </header>

      <div className="demo-hero">
        <div className="demo-hero-badge">🔬 Interactive Security Demo</div>
        <h1>Attack Simulation Lab</h1>
        <p>Run live attack simulations against the AI threat detection engine and quantum-safe cryptography layer.</p>
      </div>

      <div className="demo-tabs">
        <button className={`demo-tab${tab==='insider'?' active':''}`} onClick={() => setTab('insider')}>
          🧨 Insider Threat Simulator
        </button>
        <button className={`demo-tab${tab==='pqc'?' active':''}`} onClick={() => setTab('pqc')}>
          ⚛️ Quantum Cryptography Demo
        </button>
      </div>

      <div className="demo-section">
        {tab === 'insider' && (
          <>
            <div className="demo-section-title">🟢 Low Risk — Insider Smurfing</div>
            <div className="attack-grid">
              {ATTACKS.filter(a => a.risk === 'low').map(a => (
                <AttackCard key={a.id} attack={a} onRun={() => openModal(a)} />
              ))}
            </div>
            <div className="demo-section-title">🟠 Medium Risk — Structural Fraud</div>
            <div className="attack-grid">
              {ATTACKS.filter(a => a.risk === 'medium').map(a => (
                <AttackCard key={a.id} attack={a} onRun={() => openModal(a)} />
              ))}
            </div>
            <div className="demo-section-title">🔴 High Risk — Escalation & Tampering</div>
            <div className="attack-grid">
              {ATTACKS.filter(a => a.risk === 'high').map(a => (
                <AttackCard key={a.id} attack={a} onRun={() => openModal(a)} />
              ))}
            </div>
          </>
        )}

        {tab === 'pqc' && (
          <>
            <div className="demo-section-title">⚛️ Post-Quantum Cryptography Attacks</div>
            <div className="pqc-grid">
              {PQC_DEMOS.map(d => (
                <PQCCard key={d.id} demo={d} onRun={() => openModal(d)} />
              ))}
            </div>
          </>
        )}
      </div>

      {active && <PipelineModal attack={active} onClose={closeModal} />}
    </div>
  );
}
