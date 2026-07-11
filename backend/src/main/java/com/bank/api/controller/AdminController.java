package com.bank.api.controller;

import com.bank.api.model.AuditLog;
import com.bank.api.repository.AuditLogRepository;
import com.bank.api.model.AiAlert;
import com.bank.api.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AuditLogRepository auditLogRepository;
    private final AlertService alertService;

    public AdminController(AuditLogRepository auditLogRepository, AlertService alertService) {
        this.auditLogRepository = auditLogRepository;
        this.alertService = alertService;
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());
    }

    @PostMapping("/alerts/{id}/contain")
    public ResponseEntity<?> containUser(@PathVariable Long id) {
        return updateContainment(id, true);
    }

    @PostMapping("/alerts/{id}/release")
    public ResponseEntity<?> releaseUser(@PathVariable Long id) {
        return updateContainment(id, false);
    }

    private ResponseEntity<?> updateContainment(Long id, boolean contain) {
        try {
            AiAlert alert = contain ? alertService.contain(id) : alertService.release(id);
            return ResponseEntity.ok(Map.of(
                    "alertId", alert.getId(),
                    "username", alert.getFlaggedUsername(),
                    "status", alert.getStatus(),
                    "message", contain ? "User access has been suspended." : "User access has been restored."
            ));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }
}
