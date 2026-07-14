package com.bank.api.controller;

import com.bank.api.model.Account;
import com.bank.api.model.Transaction;
import com.bank.api.model.User;
import com.bank.api.repository.AccountRepository;
import com.bank.api.repository.TransactionRepository;
import com.bank.api.repository.UserRepository;
import com.bank.api.repository.TransactionRequestRepository;
import com.bank.api.model.TransactionRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import com.bank.api.service.RiskEngineService;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final RiskEngineService riskEngineService;
    private final TransactionRequestRepository transactionRequestRepository;

    public TransactionController(TransactionRepository transactionRepository, AccountRepository accountRepository, UserRepository userRepository, RiskEngineService riskEngineService, TransactionRequestRepository transactionRequestRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.riskEngineService = riskEngineService;
        this.transactionRequestRepository = transactionRequestRepository;
    }

    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(@RequestBody Map<String, String> request) {
        String sourceAccNum = request.get("sourceAccountNumber");
        String destAccNum = request.get("destAccountNumber");
        BigDecimal amount = new BigDecimal(request.get("amount"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElse(null);

        if (currentUser == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Account source = accountRepository.findByAccountNumber(sourceAccNum).orElse(null);
        Account dest = accountRepository.findByAccountNumber(destAccNum).orElse(null);

        if (source == null || dest == null) {
            return ResponseEntity.badRequest().body("Invalid account numbers");
        }

        boolean isOwner = source.getUser().getId().equals(currentUser.getId());
        if (!isOwner) {
            String role = currentUser.getRole();
            if (role.equals("ROLE_TELLER") || role.equals("ROLE_BRANCH_MANAGER")) {
                if (currentUser.getBranch() == null || source.getUser().getBranch() == null || !currentUser.getBranch().getId().equals(source.getUser().getBranch().getId())) {
                    return ResponseEntity.status(403).body("You can only initiate transfers for accounts in your assigned branch.");
                }
            } else if (!role.equals("ROLE_SUPER_ADMIN")) {
                return ResponseEntity.status(403).body("You do not have permission to transfer from this account.");
            }
        }

        RiskEngineService.RiskEvaluation risk = riskEngineService.evaluateTransaction(currentUser, amount, sourceAccNum);
        if (!risk.allowed()) {
            return ResponseEntity.status(403).body(risk.message());
        }

        // Maker-Checker Logic
        if (currentUser.getRole().equals("ROLE_TELLER") && amount.compareTo(new BigDecimal("10000")) >= 0) {
            TransactionRequest req = new TransactionRequest(source, dest, currentUser, amount);
            transactionRequestRepository.save(req);
            return ResponseEntity.ok("Transfer amount exceeds Teller limit. Request submitted for Manager approval.");
        }

        if (source.getBalance().compareTo(amount) < 0) {
            return ResponseEntity.badRequest().body("Insufficient funds");
        }

        source.setBalance(source.getBalance().subtract(amount));
        dest.setBalance(dest.getBalance().add(amount));

        accountRepository.save(source);
        accountRepository.save(dest);

        Transaction tx = new Transaction("TRANSFER", amount, source, dest);
        transactionRepository.save(tx);

        return ResponseEntity.ok("Transfer successful");
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getRequests() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElse(null);
        if (currentUser == null || !currentUser.getRole().equals("ROLE_BRANCH_MANAGER")) {
            return ResponseEntity.status(403).body("Only Branch Managers can view transaction requests.");
        }
        if (currentUser.getBranch() == null) {
            return ResponseEntity.badRequest().body("Manager is not assigned to any branch.");
        }
        return ResponseEntity.ok(transactionRequestRepository.findByStatusAndInitiatorBranchId("PENDING", currentUser.getBranch().getId()));
    }

    @PostMapping("/requests/{id}/approve")
    public ResponseEntity<?> approveRequest(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElse(null);
        if (currentUser == null || !currentUser.getRole().equals("ROLE_BRANCH_MANAGER")) {
            return ResponseEntity.status(403).body("Only Branch Managers can approve transaction requests.");
        }

        TransactionRequest req = transactionRequestRepository.findById(id).orElse(null);
        if (req == null) return ResponseEntity.badRequest().body("Request not found");
        if (!req.getStatus().equals("PENDING")) return ResponseEntity.badRequest().body("Request is not PENDING");

        Account source = req.getSourceAccount();
        Account dest = req.getDestAccount();
        BigDecimal amount = req.getAmount();

        if (source.getBalance().compareTo(amount) < 0) {
            req.setStatus("REJECTED");
            transactionRequestRepository.save(req);
            return ResponseEntity.badRequest().body("Insufficient funds. Request rejected.");
        }

        source.setBalance(source.getBalance().subtract(amount));
        dest.setBalance(dest.getBalance().add(amount));
        accountRepository.save(source);
        accountRepository.save(dest);

        Transaction tx = new Transaction("TRANSFER", amount, source, dest);
        transactionRepository.save(tx);

        req.setStatus("APPROVED");
        transactionRequestRepository.save(req);

        return ResponseEntity.ok("Transfer approved and executed.");
    }

    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElse(null);
        if (currentUser == null || !currentUser.getRole().equals("ROLE_BRANCH_MANAGER")) {
            return ResponseEntity.status(403).body("Only Branch Managers can reject transaction requests.");
        }

        TransactionRequest req = transactionRequestRepository.findById(id).orElse(null);
        if (req == null) return ResponseEntity.badRequest().body("Request not found");
        if (!req.getStatus().equals("PENDING")) return ResponseEntity.badRequest().body("Request is not PENDING");

        req.setStatus("REJECTED");
        transactionRequestRepository.save(req);

        return ResponseEntity.ok("Transfer rejected.");
    }
}
