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

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public TransactionController(TransactionRepository transactionRepository, AccountRepository accountRepository, UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(@RequestBody Map<String, String> request) {
        String sourceAccNum = request.get("sourceAccountNumber");
        String destAccNum = request.get("destAccountNumber");
        BigDecimal amount = new BigDecimal(request.get("amount"));

        Account source = accountRepository.findByAccountNumber(sourceAccNum).orElse(null);
        Account dest = accountRepository.findByAccountNumber(destAccNum).orElse(null);

        if (source == null || dest == null) {
            return ResponseEntity.badRequest().body("Invalid account numbers");
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
