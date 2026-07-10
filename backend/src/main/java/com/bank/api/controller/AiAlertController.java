package com.bank.api.controller;

import com.bank.api.model.AiAlert;
import com.bank.api.repository.AiAlertRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/alerts")
public class AiAlertController {

    private final AiAlertRepository aiAlertRepository;

    public AiAlertController(AiAlertRepository aiAlertRepository) {
        this.aiAlertRepository = aiAlertRepository;
    }

    @PostMapping
    public ResponseEntity<?> createAlert(@RequestBody AiAlert alert) {
        // In real life we might check a secret key for the AI module, but for now we trust it or let it run locally
        aiAlertRepository.save(alert);
        return ResponseEntity.ok("Alert saved");
    }

    @GetMapping
    public ResponseEntity<List<AiAlert>> getAlerts() {
        return ResponseEntity.ok(aiAlertRepository.findAll());
    }
}
