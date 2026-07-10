package com.bank.api.controller;

import com.bank.api.model.Account;
import com.bank.api.model.User;
import com.bank.api.repository.AccountRepository;
import com.bank.api.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public AccountController(AccountRepository accountRepository, UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getMyAccounts() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        // If SUPER_ADMIN, BRANCH_MANAGER, TELLER, they can see all accounts or search
        if (user.getRole().equals("ROLE_SUPER_ADMIN") || user.getRole().equals("ROLE_BRANCH_MANAGER") || user.getRole().equals("ROLE_TELLER")) {
            return ResponseEntity.ok(accountRepository.findAll());
        }
        
        List<Account> accounts = accountRepository.findByUserId(user.getId());
        return ResponseEntity.ok(accounts);
    }
}
