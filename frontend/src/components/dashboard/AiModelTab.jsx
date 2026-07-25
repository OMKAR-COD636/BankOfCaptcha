import React from 'react';
import { Activity } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

const AiModelTab = ({ aiMetrics, triggerAdaptiveTraining }) => {
  const { t } = useTranslation();
  return (
    <div className="admin-tab-content animated-fade-in">
      <h2 className="section-title"><Activity size={24} className="icon-blue" /> {t('dashboard.aiModelTraining')}</h2>
      
      <div className="form-card mb-4">
        <h3 style={{ marginTop: 0 }}>{t('dashboard.modelDescription')}</h3>
        <p><strong>{t('dashboard.architecture')}:</strong> InsiderThreatLSTM (Role-Conditioned, MSE Loss, Positional Encoding)</p>
        <p><strong>{t('dashboard.version')}:</strong> v3 — 4-Signal Architecture</p>
        <p>
          {t('dashboard.modelDescText')} and reconstructs embeddings using an LSTM Autoencoder. 
          It is designed to detect Temporal Anomalies, Role-Action Violations, Statistical Transaction Bursts, 
          and Behavioral Sequence Anomalies.
        </p>
      </div>

      <div className="summary-cards-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="summary-card">
          <div className="summary-card-header">
            <Activity size={20} className="icon-blue" />
            <h3>{t('dashboard.overallDetectionRate')}</h3>
          </div>
          <div className="summary-card-value">
            {aiMetrics?.overallDetectionRate != null ? `${(aiMetrics.overallDetectionRate * 100).toFixed(1)}%` : 'N/A'}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-header">
            <Activity size={20} className="icon-blue" />
            <h3>{t('dashboard.validationLoss')}</h3>
          </div>
          <div className="summary-card-value">
            {aiMetrics?.mseLoss != null ? aiMetrics.mseLoss.toFixed(4) : 'N/A'}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-header">
            <Activity size={20} className="icon-blue" />
            <h3>{t('dashboard.dynamicThreshold')}</h3>
          </div>
          <div className="summary-card-value">
            {aiMetrics?.threshold != null ? aiMetrics.threshold.toFixed(4) : 'N/A'}
          </div>
        </div>
      </div>

      <div className="form-card mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 10px 0' }}>{t('dashboard.adaptiveTraining')}</h3>
          <p style={{ margin: 0, color: 'var(--text-light)' }}>
            {t('dashboard.status')}: <strong>{aiMetrics?.status || 'UNKNOWN'}</strong> 
            {aiMetrics?.lastTrainedAt && ` (Last trained: ${new Date(aiMetrics.lastTrainedAt + 'Z').toLocaleString()})`}
          </p>
          <p style={{ margin: '10px 0 0 0', color: 'var(--text-light)', fontSize: '0.9rem' }}>
            {t('dashboard.triggerTrainingText')} marked as False Positives and incorporate them into the model to prevent future false alarms.
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
