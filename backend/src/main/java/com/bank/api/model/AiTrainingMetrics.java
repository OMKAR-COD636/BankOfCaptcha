package com.bank.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_training_metrics")
public class AiTrainingMetrics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double threshold;
    private Double mseLoss;
    private Double overallDetectionRate;
    
    private LocalDateTime lastTrainedAt;

    @Column(nullable = false)
    private String status = "IDLE"; // IDLE, TRAIN_REQUESTED, TRAINING

    public AiTrainingMetrics() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Double getThreshold() { return threshold; }
    public void setThreshold(Double threshold) { this.threshold = threshold; }
    public Double getMseLoss() { return mseLoss; }
    public void setMseLoss(Double mseLoss) { this.mseLoss = mseLoss; }
    public Double getOverallDetectionRate() { return overallDetectionRate; }
    public void setOverallDetectionRate(Double overallDetectionRate) { this.overallDetectionRate = overallDetectionRate; }
    public LocalDateTime getLastTrainedAt() { return lastTrainedAt; }
    public void setLastTrainedAt(LocalDateTime lastTrainedAt) { this.lastTrainedAt = lastTrainedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
