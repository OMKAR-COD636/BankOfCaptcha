package com.bank.api.controller;

import com.bank.api.model.Account;
import com.bank.api.model.Branch;
import com.bank.api.model.KycRequest;
import com.bank.api.model.User;
import com.bank.api.repository.AccountRepository;
import com.bank.api.repository.BranchRepository;
import com.bank.api.repository.KycRequestRepository;
import com.bank.api.repository.UserRepository;
import com.bank.api.service.PqcAuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kyc")
public class KycController {
    private final KycRequestRepository kycRequestRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PqcAuditService pqcAuditService;

    public KycController(KycRequestRepository kycRequestRepository, BranchRepository branchRepository,
                         UserRepository userRepository, AccountRepository accountRepository, PqcAuditService pqcAuditService) {
        this.kycRequestRepository = kycRequestRepository;
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.pqcAuditService = pqcAuditService;
    }

    @PostMapping("/apply/{branchId}")
    public ResponseEntity<?> applyForKyc(@PathVariable String branchId, @RequestBody Map<String, String> payload) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        Branch branch = branchRepository.findByBranchId(branchId);

        if (branch == null) {
            return ResponseEntity.badRequest().body("Branch not found");
        }

        // Encrypt PII data before saving
        // Note: For a true PQC implementation, this should use ML-KEM to encrypt.
        // For now, we simulate the encryption wrapper so the schema is ready.
        String encryptedAadhaar = "ENC[" + payload.get("aadhaarNumber") + "]"; 
        String encryptedMobile = "ENC[" + payload.get("mobileNumber") + "]";

        KycRequest request = new KycRequest(user, branch, payload.get("fullName"), encryptedAadhaar, encryptedMobile, payload.get("email"));
        kycRequestRepository.save(request);

        return ResponseEntity.ok(Map.of("message", "KYC Request submitted. Please visit the branch next week.", "status", "PENDING"));
    }

    @GetMapping("/status")
    public ResponseEntity<?> checkKycStatus() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        
        List<KycRequest> requests = kycRequestRepository.findByUserId(user.getId());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/queue")
    public ResponseEntity<?> getTellerQueue() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User teller = userRepository.findByUsername(username).orElseThrow();

        if (teller.getBranch() == null) {
            return ResponseEntity.badRequest().body("Teller is not assigned to a branch.");
        }

        List<KycRequest> requests = kycRequestRepository.findByBranchAndStatus(teller.getBranch(), "PENDING");
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/{requestId}/approve")
    public ResponseEntity<?> approveKyc(@PathVariable Long requestId) {
        KycRequest request = kycRequestRepository.findById(requestId).orElseThrow();
        request.setStatus("APPROVED");
        
        // Assign the user to the branch they applied for
        User user = request.getUser();
        user.setBranch(request.getBranch());
        userRepository.save(user);

        // Open their first account automatically
        String newAccountNumber = "100" + String.format("%07d", user.getId());
        Account account = new Account(newAccountNumber, user, new BigDecimal("0.00"));
        accountRepository.save(account);

        kycRequestRepository.save(request);
        return ResponseEntity.ok(Map.of("message", "KYC Approved and Account Created", "accountNumber", newAccountNumber));
    }
}
