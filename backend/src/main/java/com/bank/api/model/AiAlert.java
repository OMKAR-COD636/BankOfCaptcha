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
}
