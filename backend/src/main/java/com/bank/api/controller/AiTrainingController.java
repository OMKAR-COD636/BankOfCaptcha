package com.bank.api.controller;

import com.bank.api.model.AiTrainingMetrics;
import com.bank.api.repository.AiTrainingMetricsRepository;
import com.bank.api.config.properties.AiConfigProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/ai/training")
public class AiTrainingController {

    private final AiTrainingMetricsRepository metricsRepository;
    private final AiConfigProperties aiConfigProperties;

    public AiTrainingController(AiTrainingMetricsRepository metricsRepository,
                                AiConfigProperties aiConfigProperties) {
        this.metricsRepository = metricsRepository;
        this.aiConfigProperties = aiConfigProperties;
    }

    private AiTrainingMetrics getOrCreateMetrics() {
        return metricsRepository.findAll().stream().findFirst().orElseGet(() -> {
            AiTrainingMetrics metrics = new AiTrainingMetrics();
            return metricsRepository.save(metrics);
        });
    }

    @PostMapping("/trigger")
    public ResponseEntity<?> triggerTraining() {
        AiTrainingMetrics metrics = getOrCreateMetrics();
        metrics.setStatus("TRAIN_REQUESTED");
        metricsRepository.save(metrics);
        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/status")
    public ResponseEntity<?> getTrainingStatus() {
        AiTrainingMetrics metrics = getOrCreateMetrics();
        return ResponseEntity.ok(java.util.Map.of("status", metrics.getStatus()));
    }


    @PostMapping("/metrics")
    public ResponseEntity<?> updateMetrics(@RequestHeader(value = "X-AI-Service-Key", required = false) String suppliedKey,
                                           @RequestBody AiTrainingMetrics newMetrics) {
        if (!aiConfigProperties.getServiceKey().equals(suppliedKey)) {
            return ResponseEntity.status(401).body("Invalid AI service key");
        }
        
        AiTrainingMetrics metrics = getOrCreateMetrics();
        metrics.setThreshold(newMetrics.getThreshold());
        metrics.setMseLoss(newMetrics.getMseLoss());
        metrics.setOverallDetectionRate(newMetrics.getOverallDetectionRate());
        metrics.setLastTrainedAt(LocalDateTime.now());
        metrics.setStatus("IDLE");
        metricsRepository.save(metrics);
        
        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/metrics")
    public ResponseEntity<?> getMetrics() {
        return ResponseEntity.ok(getOrCreateMetrics());
    }
}
