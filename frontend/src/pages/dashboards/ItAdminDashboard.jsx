import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import DashboardShell from '../../components/shared/DashboardShell';
import AiModelTab from '../../components/dashboard/AiModelTab';
import useAuth from '../../hooks/useAuth';
import * as api from '../../api/client';

/**
 * IT Admin Dashboard
 * Single-tab interface for the ROLE_IT_ADMIN role.
 *
 * Responsibilities:
 *  - View AI model metrics (detection rate, MSE loss, dynamic threshold)
 *  - View current training status and last-trained timestamp
 *  - Trigger adaptive retraining based on false-positive feedback
 *
 * Routes called:
 *  GET  /api/ai/training/metrics   — load model metrics on mount
 *  POST /api/ai/training/trigger   — request adaptive retraining
 *
 * Intentionally excluded (SUPER_ADMIN only):
 *  - Security & Intelligence (alert contain/release)
 *  - Staff Management
 *  - Branch Operations
 *  - Compliance & Audit
 */
const ItAdminDashboard = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [aiMetrics, setAiMetrics] = useState(null);
  const [trainingError, setTrainingError] = useState('');

  // Fetch AI training metrics on mount
  useEffect(() => {
    api.fetchAiTrainingMetrics(token)
      .then(setAiMetrics)
      .catch((err) => {
        console.error('Failed to load AI training metrics:', err);
        setTrainingError('Could not load AI model metrics. Please refresh.');
      });
  }, [token]);

  /**
   * Triggers adaptive retraining on the backend.
   * Sets status = TRAIN_REQUESTED; the Python AI service picks it up.
   * Re-fetches metrics after triggering so the UI reflects the new status.
   */
  const handleTriggerAdaptiveTraining = useCallback(async () => {
    try {
      await api.triggerAdaptiveTraining(token);
      // Re-fetch updated metrics (status will now be TRAIN_REQUESTED)
      const updated = await api.fetchAiTrainingMetrics(token);
      setAiMetrics(updated);
      setTrainingError('');
    } catch (err) {
      console.error('Failed to trigger adaptive training:', err);
      setTrainingError('Failed to trigger adaptive training. Please try again.');
    }
  }, [token]);

  return (
    <DashboardShell>
      <div className="admin-view">
        {/* Single tab header — visually consistent with other dashboards */}
        <div className="admin-tabs">
          <button className="admin-tab active">
            AI Model &amp; Training
          </button>
        </div>

        {trainingError && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '16px',
            }}
          >
            {trainingError}
          </div>
        )}

        <AiModelTab
          aiMetrics={aiMetrics}
          triggerAdaptiveTraining={handleTriggerAdaptiveTraining}
        />
      </div>
    </DashboardShell>
  );
};

export default ItAdminDashboard;
