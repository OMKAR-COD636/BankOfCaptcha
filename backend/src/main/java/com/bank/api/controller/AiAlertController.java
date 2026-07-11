package com.bank.api.controller;

import com.bank.api.model.AiAlert;
import com.bank.api.service.AlertService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/alerts")
public class AiAlertController {

    private final AlertService alertService;
    private final String aiServiceKey;

    public AiAlertController(AlertService alertService,
                             @Value("${app.ai.service-key}") String aiServiceKey) {
        this.alertService = alertService;
        this.aiServiceKey = aiServiceKey;
    }

    @PostMapping
    public ResponseEntity<?> createAlert(@RequestHeader(value = "X-AI-Service-Key", required = false) String suppliedKey,
                                         @RequestBody AiAlert alert) {
        if (!aiServiceKey.equals(suppliedKey)) {
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
}
