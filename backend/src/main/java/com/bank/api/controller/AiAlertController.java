package com.bank.api.controller;

import com.bank.api.model.AiAlert;
import com.bank.api.service.AlertService;
import com.bank.api.config.properties.AiConfigProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/alerts")
public class AiAlertController {

    private final AlertService alertService;
    private final AiConfigProperties aiConfigProperties;

    public AiAlertController(AlertService alertService,
                             AiConfigProperties aiConfigProperties) {
        this.alertService = alertService;
        this.aiConfigProperties = aiConfigProperties;
    }

    @PostMapping
    public ResponseEntity<?> createAlert(@RequestHeader(value = "X-AI-Service-Key", required = false) String suppliedKey,
                                         @RequestBody AiAlert alert) {
        if (!aiConfigProperties.getServiceKey().equals(suppliedKey)) {
            return ResponseEntity.status(401).body("Invalid AI service key");
        }
        try {
            return ResponseEntity.ok(alertService.create(alert, "AI_SERVICE"));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(exception.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<AiAlert>> getAlerts() {
        return ResponseEntity.ok(alertService.getAlerts());
    }

    @PutMapping("/{id}/feedback")
    public ResponseEntity<?> updateFeedback(@PathVariable Long id, @RequestBody java.util.Map<String, Boolean> payload) {
        try {
            Boolean isFalsePositive = payload.getOrDefault("isFalsePositive", false);
            return ResponseEntity.ok(alertService.setFeedback(id, isFalsePositive));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(exception.getMessage());
        }
    }
}
