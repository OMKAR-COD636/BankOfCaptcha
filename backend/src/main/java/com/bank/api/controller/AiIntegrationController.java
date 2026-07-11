package com.bank.api.controller;

import com.bank.api.model.AuditLog;
import com.bank.api.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Narrow, API-key protected integration surface for the separate AI detection module.
 * It deliberately returns event metadata only, never private keys or encrypted evidence.
 */
@RestController
@RequestMapping("/api/ai")
public class AiIntegrationController {
    private final AuditLogRepository auditLogRepository;
    private final String aiServiceKey;

    public AiIntegrationController(AuditLogRepository auditLogRepository,
                                   @Value("${app.ai.service-key}") String aiServiceKey) {
        this.auditLogRepository = auditLogRepository;
        this.aiServiceKey = aiServiceKey;
    }

    @GetMapping("/audit-events")
    public ResponseEntity<?> getAuditEvents(@RequestHeader(value = "X-AI-Service-Key", required = false) String suppliedKey) {
        if (!aiServiceKey.equals(suppliedKey)) {
            return ResponseEntity.status(401).body("Invalid AI service key");
        }
        List<Map<String, Object>> events = auditLogRepository.findAllByOrderByTimestampDesc().stream()
                .map(this::toAiEvent)
                .toList();
        return ResponseEntity.ok(events);
    }

    private Map<String, Object> toAiEvent(AuditLog log) {
        return Map.of(
                "id", log.getId(),
                "username", log.getUsername(),
                "action", log.getAction(),
                "timestamp", log.getTimestamp(),
                "pqcProtected", log.getPqcSignature() != null
        );
    }
}
