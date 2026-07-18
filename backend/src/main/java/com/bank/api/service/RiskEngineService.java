package com.bank.api.service;

import com.bank.api.model.AiAlert;
import com.bank.api.model.User;
import com.bank.api.repository.AiAlertRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class RiskEngineService {

    private final AiAlertRepository aiAlertRepository;
    private final AlertService alertService;

    public RiskEngineService(AiAlertRepository aiAlertRepository, AlertService alertService) {
        this.aiAlertRepository = aiAlertRepository;
        this.alertService = alertService;
    }

    public RiskEvaluation evaluateTransaction(User user, BigDecimal amount, String sourceAccountNumber) {
        // Rule 1: Is there an open AI alert for this user?
        List<AiAlert> openAlerts = aiAlertRepository.findByFlaggedUsernameAndStatus(user.getUsername(), "OPEN");
        if (!openAlerts.isEmpty()) {
            // Do not create a *new* alert to avoid spamming the DB during bursts.
            // Just silently block the transaction.
            return new RiskEvaluation(false, "Transaction blocked due to active high-risk alerts.");
        }

        // Rule 2: The hardcoded > 10,000 rule has been REMOVED.
        // Financial anomalies are now detected dynamically by the AI Statistical Profiler,
        // which adapts to the user's specific behavioral baseline.

        return new RiskEvaluation(true, "Transaction risk is within acceptable parameters.");
    }

    public RiskEvaluation evaluateBulkDataAccess(User user, String endpoint) {
        // Rule 1: Bulk access scoping (Currently disabled for Tellers so Dashboard can load)
        // Future enhancement: Enforce branch-level scoping here.

        // Rule 2: Open alerts
        List<AiAlert> openAlerts = aiAlertRepository.findByFlaggedUsernameAndStatus(user.getUsername(), "OPEN");
        if (!openAlerts.isEmpty()) {
            // Do not create a *new* alert to avoid spamming the DB.
            return new RiskEvaluation(false, "Privileged access blocked due to active high-risk alerts.");
        }

        return new RiskEvaluation(true, "Data access risk is within acceptable parameters.");
    }

    private void blockAndAlert(User user, String description) {
        AiAlert alert = new AiAlert();
        alert.setFlaggedUsername(user.getUsername());
        alert.setSeverity("HIGH");
        alert.setDescription(description);
        alert.setRiskScore(90);
        
        alertService.create(alert, "Internal Risk Engine");
    }

    public record RiskEvaluation(boolean allowed, String message) {}
}
