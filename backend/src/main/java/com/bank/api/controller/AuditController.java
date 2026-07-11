package com.bank.api.controller;

import com.bank.api.model.AuditLog;
import com.bank.api.repository.AuditLogRepository;
import com.bank.api.service.PqcAuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditLogRepository auditLogRepository;
    private final PqcAuditService pqcAuditService;

    public AuditController(AuditLogRepository auditLogRepository, PqcAuditService pqcAuditService) {
        this.auditLogRepository = auditLogRepository;
        this.pqcAuditService = pqcAuditService;
    }

    @GetMapping("/logs")
    public ResponseEntity<List<AuditLog>> getLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());
    }

    /** Verifies that the selected record has not been modified since it was signed. */
    @GetMapping("/logs/{id}/verify")
    public ResponseEntity<?> verifyLog(@PathVariable Long id) {
        return auditLogRepository.findById(id)
                .<ResponseEntity<?>>map(log -> {
                    PqcAuditService.VerificationResult result = pqcAuditService.verify(log);
                    return ResponseEntity.ok(Map.of(
                            "auditLogId", log.getId(),
                            "valid", result.valid(),
                            "message", result.message(),
                            "signatureAlgorithm", log.getSignatureAlgorithm() == null ? "Not protected" : log.getSignatureAlgorithm(),
                            "encryptionAlgorithm", log.getEncryptionAlgorithm() == null ? "Not protected" : log.getEncryptionAlgorithm()
                    ));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
