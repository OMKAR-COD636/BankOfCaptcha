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
            blockAndAlert(user, "User attempted transfer with an OPEN anomaly alert on their account.");
            return new RiskEvaluation(false, "Transaction blocked due to active high-risk alerts.");
        }

        // Rule 2: Exceptionally high transaction amount for standard user
        if (user.getRole().equals("ROLE_CUSTOMER") && amount.compareTo(new BigDecimal("10000")) > 0) {
            blockAndAlert(user, "User attempted to transfer an unusually large amount (" + amount + ") bypassing standard clearance.");
            return new RiskEvaluation(false, "Transfer exceeds allowable limit for standard user role. Step-up authentication required.");
        }

        return new RiskEvaluation(true, "Transaction risk is within acceptable parameters.");
    }

    public RiskEvaluation evaluateBulkDataAccess(User user, String endpoint) {
        // Rule 1: Are they trying to scrape the entire account database?
        if (user.getRole().equals("ROLE_TELLER")) {
            blockAndAlert(user, "Teller attempted to bulk-export or view all bank accounts globally (" + endpoint + ").");
            return new RiskEvaluation(false, "Access to global account registry is blocked for Tellers outside of specific branch scope.");
        }

        // Rule 2: Open alerts
        List<AiAlert> openAlerts = aiAlertRepository.findByFlaggedUsernameAndStatus(user.getUsername(), "OPEN");
        if (!openAlerts.isEmpty()) {
            blockAndAlert(user, "Privileged user attempted bulk access (" + endpoint + ") while under an OPEN anomaly alert.");
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
