package com.bank.api.controller;

import com.bank.api.model.AuditLog;
import com.bank.api.model.Transaction;
import com.bank.api.model.User;
import com.bank.api.repository.AuditLogRepository;
import com.bank.api.repository.TransactionRepository;
import com.bank.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Narrow, API-key protected integration surface for the separate AI detection module.
 * It deliberately returns event metadata only, never private keys or encrypted evidence.
 */
@RestController
@RequestMapping("/api/ai")
public class AiIntegrationController {
    private final AuditLogRepository auditLogRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final String aiServiceKey;

    public AiIntegrationController(AuditLogRepository auditLogRepository,
                                   TransactionRepository transactionRepository,
                                   UserRepository userRepository,
                                   @Value("${app.ai.service-key}") String aiServiceKey) {
        this.auditLogRepository = auditLogRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.aiServiceKey = aiServiceKey;
    }

    /**
     * Returns audit events for AI analysis.
     * Supports clamped fetching: returns events from the last maxDays days,
     * but at most maxRequests per user.
     *
     * @param maxDays     Maximum age of events in days (default: 30)
     * @param maxRequests Maximum events per user (default: 100)
     */
    @GetMapping("/audit-events")
    public ResponseEntity<?> getAuditEvents(
            @RequestHeader(value = "X-AI-Service-Key", required = false) String suppliedKey,
            @RequestParam(value = "maxDays", defaultValue = "30") int maxDays,
            @RequestParam(value = "maxRequests", defaultValue = "100") int maxRequests) {

        if (!aiServiceKey.equals(suppliedKey)) {
            return ResponseEntity.status(401).body("Invalid AI service key");
        }

        LocalDateTime cutoff = LocalDateTime.now().minusDays(maxDays);
        List<AuditLog> timeWindowedLogs = auditLogRepository.findByTimestampAfterOrderByTimestampDesc(cutoff);

        // Build a username -> role lookup for enrichment
        Map<String, String> roleCache = new HashMap<>();

        // Group by username, clamp each user to maxRequests, then flatten
        List<Map<String, Object>> events = timeWindowedLogs.stream()
                .collect(Collectors.groupingBy(AuditLog::getUsername))
                .entrySet().stream()
                .flatMap(entry -> {
                    String username = entry.getKey();
                    List<AuditLog> userLogs = entry.getValue();
                    // Clamp: take at most maxRequests (already sorted newest-first)
                    List<AuditLog> clamped = userLogs.size() > maxRequests
                            ? userLogs.subList(0, maxRequests) : userLogs;
                    return clamped.stream().map(log -> toAiEvent(log, roleCache));
                })
                .toList();

        return ResponseEntity.ok(events);
    }

    /**
     * Returns recent transaction data with amounts for the AI Statistical Profiler.
     * This gives the AI engine visibility into financial magnitude without touching
     * the PQC-sealed audit logs.
     *
     * @param maxDays Maximum age of transactions in days (default: 30)
     */
    @GetMapping("/transaction-summary")
    public ResponseEntity<?> getTransactionSummary(
            @RequestHeader(value = "X-AI-Service-Key", required = false) String suppliedKey,
            @RequestParam(value = "maxDays", defaultValue = "30") int maxDays) {

        if (!aiServiceKey.equals(suppliedKey)) {
            return ResponseEntity.status(401).body("Invalid AI service key");
        }

        LocalDateTime cutoff = LocalDateTime.now().minusDays(maxDays);
        List<Transaction> transactions = transactionRepository.findByTimestampAfterOrderByTimestampDesc(cutoff);

        List<Map<String, Object>> summaries = transactions.stream()
                .map(this::toTransactionSummary)
                .toList();

        return ResponseEntity.ok(summaries);
    }

    private Map<String, Object> toAiEvent(AuditLog log, Map<String, String> roleCache) {
        String role = roleCache.computeIfAbsent(log.getUsername(), username ->
                userRepository.findByUsername(username)
                        .map(User::getRole)
                        .orElse("UNKNOWN"));

        Map<String, Object> event = new LinkedHashMap<>();
        event.put("id", log.getId());
        event.put("username", log.getUsername());
        event.put("role", role);
        event.put("action", log.getAction());
        event.put("timestamp", log.getTimestamp());
        event.put("pqcProtected", log.getPqcSignature() != null);
        return event;
    }

    private Map<String, Object> toTransactionSummary(Transaction tx) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("id", tx.getId());
        summary.put("type", tx.getType());
        summary.put("amount", tx.getAmount());
        summary.put("timestamp", tx.getTimestamp());

        if (tx.getSourceAccount() != null && tx.getSourceAccount().getUser() != null) {
            summary.put("sourceUsername", tx.getSourceAccount().getUser().getUsername());
            summary.put("sourceRole", tx.getSourceAccount().getUser().getRole());
        }
        if (tx.getDestAccount() != null && tx.getDestAccount().getUser() != null) {
            summary.put("destUsername", tx.getDestAccount().getUser().getUsername());
        }
        return summary;
    }
}
