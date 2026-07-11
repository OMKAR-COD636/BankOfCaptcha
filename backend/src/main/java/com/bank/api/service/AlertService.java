package com.bank.api.service;

import com.bank.api.model.AiAlert;
import com.bank.api.model.User;
import com.bank.api.repository.AiAlertRepository;
import com.bank.api.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AlertService {
    private final AiAlertRepository aiAlertRepository;
    private final UserRepository userRepository;

    public AlertService(AiAlertRepository aiAlertRepository, UserRepository userRepository) {
        this.aiAlertRepository = aiAlertRepository;
        this.userRepository = userRepository;
    }

    public AiAlert create(AiAlert alert, String source) {
        if (alert.getFlaggedUsername() == null || alert.getFlaggedUsername().isBlank()
                || alert.getDescription() == null || alert.getDescription().isBlank()) {
            throw new IllegalArgumentException("flaggedUsername and description are required");
        }
        if (alert.getSeverity() == null || alert.getSeverity().isBlank()) {
            alert.setSeverity("MEDIUM");
        }
        alert.setTimestamp(LocalDateTime.now());
        alert.setStatus("OPEN");
        alert.setDetectionSource(source);
        return aiAlertRepository.save(alert);
    }

    public List<AiAlert> getAlerts() {
        return aiAlertRepository.findAllByOrderByTimestampDesc();
    }

    @Transactional
    public AiAlert contain(Long alertId) {
        AiAlert alert = findAlert(alertId);
        User user = userRepository.findByUsername(alert.getFlaggedUsername())
                .orElseThrow(() -> new IllegalArgumentException("Flagged user no longer exists"));
        user.setAccessSuspended(true);
        alert.setStatus("CONTAINED");
        return aiAlertRepository.save(alert);
    }

    @Transactional
    public AiAlert release(Long alertId) {
        AiAlert alert = findAlert(alertId);
        User user = userRepository.findByUsername(alert.getFlaggedUsername())
                .orElseThrow(() -> new IllegalArgumentException("Flagged user no longer exists"));
        user.setAccessSuspended(false);
        alert.setStatus("RESOLVED");
        return aiAlertRepository.save(alert);
    }

    private AiAlert findAlert(Long alertId) {
        return aiAlertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found"));
    }
}
