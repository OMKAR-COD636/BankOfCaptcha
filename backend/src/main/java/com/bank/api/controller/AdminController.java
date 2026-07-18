package com.bank.api.controller;

import com.bank.api.model.AuditLog;
import com.bank.api.repository.AuditLogRepository;
import com.bank.api.model.AiAlert;
import com.bank.api.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bank.api.model.User;
import com.bank.api.model.Branch;
import com.bank.api.repository.UserRepository;
import com.bank.api.repository.BranchRepository;
import com.bank.api.repository.TransactionRepository;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AuditLogRepository auditLogRepository;
    private final AlertService alertService;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final TransactionRepository transactionRepository;

    public AdminController(AuditLogRepository auditLogRepository, AlertService alertService, UserRepository userRepository, BranchRepository branchRepository, TransactionRepository transactionRepository) {
        this.auditLogRepository = auditLogRepository;
        this.alertService = alertService;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.transactionRepository = transactionRepository;
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());
    }

    @GetMapping("/users/{username}/activity")
    public ResponseEntity<?> getUserActivity(@PathVariable String username) {
        Map<String, Object> response = new HashMap<>();
        response.put("logs", auditLogRepository.findRecentByUsername(username, 20));
        response.put("transactions", transactionRepository.findRecentByUsername(username, 20));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/staff")
    public ResponseEntity<?> createStaff(@RequestBody Map<String, String> payload) {
        String username = payload.get("username");
        String password = payload.get("password");
        String role = payload.get("role"); // e.g. ROLE_TELLER, ROLE_BRANCH_MANAGER
        String branchId = payload.get("branchId");

        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }

        Branch branch = branchRepository.findById(Long.parseLong(branchId)).orElse(null);
        if (branch == null) return ResponseEntity.badRequest().body(Map.of("error", "Invalid branch selected"));

        User staff = new User(username, password, role, branch);
        userRepository.save(staff);

        return ResponseEntity.ok(Map.of("message", "Staff created successfully!"));
    }

    @PostMapping("/alerts/{id}/contain")
    public ResponseEntity<?> containUser(@PathVariable Long id) {
        return updateContainment(id, true);
    }

    @PostMapping("/alerts/{id}/release")
    public ResponseEntity<?> releaseUser(@PathVariable Long id) {
        return updateContainment(id, false);
    }

    @PostMapping("/alerts/resolve-all")
    public ResponseEntity<?> resolveAll() {
        alertService.resolveAll();
        return ResponseEntity.ok(Map.of("message", "All users have been unfrozen and all alerts resolved."));
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
