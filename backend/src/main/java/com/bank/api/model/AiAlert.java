package com.bank.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_alerts")
public class AiAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String flaggedUsername;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false)
    private String severity; // HIGH, MEDIUM, LOW

    private LocalDateTime timestamp;

    @Column(nullable = false)
    private String status = "OPEN"; // OPEN, INVESTIGATING, CONTAINED, RESOLVED

    @Column(nullable = false)
    private String detectionSource = "RULE_ENGINE"; // RULE_ENGINE or AI_SERVICE

    private Integer riskScore;

    @Column(nullable = false)
    private Boolean isFalsePositive = false;

    public AiAlert() {}

    public AiAlert(String flaggedUsername, String description, String severity) {
        this.flaggedUsername = flaggedUsername;
        this.description = description;
        this.severity = severity;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFlaggedUsername() { return flaggedUsername; }
    public void setFlaggedUsername(String flaggedUsername) { this.flaggedUsername = flaggedUsername; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDetectionSource() { return detectionSource; }
    public void setDetectionSource(String detectionSource) { this.detectionSource = detectionSource; }
    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }
    public Boolean getIsFalsePositive() { return isFalsePositive; }
    public void setIsFalsePositive(Boolean isFalsePositive) { this.isFalsePositive = isFalsePositive; }
}
