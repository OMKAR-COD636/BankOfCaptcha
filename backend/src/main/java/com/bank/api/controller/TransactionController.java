package com.bank.api.controller;

import com.bank.api.model.Account;
import com.bank.api.model.Transaction;
import com.bank.api.model.User;
import com.bank.api.repository.AccountRepository;
import com.bank.api.repository.TransactionRepository;
import com.bank.api.repository.UserRepository;
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

    public TransactionController(TransactionRepository transactionRepository, AccountRepository accountRepository, UserRepository userRepository, RiskEngineService riskEngineService) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.riskEngineService = riskEngineService;
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
            if (!role.equals("ROLE_TELLER") && !role.equals("ROLE_BRANCH_MANAGER") && !role.equals("ROLE_SUPER_ADMIN")) {
                return ResponseEntity.status(403).body("You do not have permission to transfer from this account.");
            }
        }

        RiskEngineService.RiskEvaluation risk = riskEngineService.evaluateTransaction(currentUser, amount, sourceAccNum);
        if (!risk.allowed()) {
            return ResponseEntity.status(403).body(risk.message());
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
}
