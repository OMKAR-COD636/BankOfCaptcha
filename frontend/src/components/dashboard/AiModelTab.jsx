import React from 'react';
import { Activity } from 'lucide-react';

const AiModelTab = ({ aiMetrics, triggerAdaptiveTraining }) => {
  return (
    <div className="admin-tab-content animated-fade-in">
      <h2 className="section-title"><Activity size={24} className="icon-blue" /> AI Model & Training</h2>
      
      <div className="card mb-4" style={{ padding: '20px', background: 'white', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>Model Description</h3>
        <p><strong>Architecture:</strong> InsiderThreatLSTM (Role-Conditioned, MSE Loss, Positional Encoding)</p>
        <p><strong>Version:</strong> v3 — 4-Signal Architecture</p>
        <p>
          The AI engine continuously monitors user behavior and reconstructs embeddings using an LSTM Autoencoder. 
          It is designed to detect Temporal Anomalies, Role-Action Violations, Statistical Transaction Bursts, 
          and Behavioral Sequence Anomalies.
        </p>
      </div>

      <div className="summary-cards-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="summary-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Activity size={20} className="icon-blue" />
            <h3 style={{ margin: 0, color: '#475569', fontSize: '1rem' }}>Overall Detection Rate</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>
            {aiMetrics?.overallDetectionRate != null ? `${(aiMetrics.overallDetectionRate * 100).toFixed(1)}%` : 'N/A'}
          </div>
        </div>
        <div className="summary-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Activity size={20} className="icon-blue" />
            <h3 style={{ margin: 0, color: '#475569', fontSize: '1rem' }}>Validation Loss (MSE)</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>
            {aiMetrics?.mseLoss != null ? aiMetrics.mseLoss.toFixed(4) : 'N/A'}
          </div>
        </div>
        <div className="summary-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Activity size={20} className="icon-blue" />
            <h3 style={{ margin: 0, color: '#475569', fontSize: '1rem' }}>Dynamic Threshold</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>
            {aiMetrics?.threshold != null ? aiMetrics.threshold.toFixed(4) : 'N/A'}
          </div>
        </div>
      </div>

      <div className="card mb-4" style={{ padding: '20px', background: 'white', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 10px 0' }}>Adaptive Training</h3>
          <p style={{ margin: 0, color: '#475569' }}>
            Status: <strong>{aiMetrics?.status || 'UNKNOWN'}</strong> 
            {aiMetrics?.lastTrainedAt && ` (Last trained: ${new Date(aiMetrics.lastTrainedAt + 'Z').toLocaleString()})`}
          </p>
          <p style={{ margin: '10px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Triggering adaptive training will fetch alerts marked as False Positives and incorporate them into the model to prevent future false alarms.
          </p>
        </div>
        <button 
          onClick={triggerAdaptiveTraining} 
          disabled={aiMetrics?.status === 'TRAIN_REQUESTED' || aiMetrics?.status === 'TRAINING'}
          style={{ 
            padding: '12px 24px', 
            background: '#16a34a', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: (aiMetrics?.status === 'TRAIN_REQUESTED' || aiMetrics?.status === 'TRAINING') ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold',
            opacity: (aiMetrics?.status === 'TRAIN_REQUESTED' || aiMetrics?.status === 'TRAINING') ? 0.6 : 1
          }}>
          {aiMetrics?.status === 'TRAIN_REQUESTED' ? 'Training Requested...' : 'Trigger Adaptive Training'}
        </button>
      </div>

    </div>
  );
};

export default AiModelTab;
