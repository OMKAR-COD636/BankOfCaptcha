package com.bank.api.controller;

import com.bank.api.model.Account;
import com.bank.api.model.User;
import com.bank.api.repository.AccountRepository;
import com.bank.api.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.bank.api.service.RiskEngineService;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final RiskEngineService riskEngineService;

    public AccountController(AccountRepository accountRepository, UserRepository userRepository, RiskEngineService riskEngineService) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.riskEngineService = riskEngineService;
    }

    @GetMapping
    public ResponseEntity<?> getMyAccounts() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        // If SUPER_ADMIN, they can see all accounts
        if (user.getRole().equals("ROLE_SUPER_ADMIN")) {
            RiskEngineService.RiskEvaluation risk = riskEngineService.evaluateBulkDataAccess(user, "/api/accounts");
            if (!risk.allowed()) {
                return ResponseEntity.status(403).body(risk.message());
            }
            return ResponseEntity.ok(accountRepository.findAll());
        }

        // If TELLER or BRANCH_MANAGER, they can only see accounts in their assigned branch
        if (user.getRole().equals("ROLE_BRANCH_MANAGER") || user.getRole().equals("ROLE_TELLER")) {
            RiskEngineService.RiskEvaluation risk = riskEngineService.evaluateBulkDataAccess(user, "/api/accounts");
            if (!risk.allowed()) {
                return ResponseEntity.status(403).body(risk.message());
            }
            if (user.getBranch() == null) {
                return ResponseEntity.badRequest().body("Staff member is not assigned to any branch.");
            }
            return ResponseEntity.ok(accountRepository.findByUserBranch_Id(user.getBranch().getId()));
        }
        
        List<Account> accounts = accountRepository.findByUserId(user.getId());
        return ResponseEntity.ok(accounts);
    }
}
