package com.bank.api.service;

import com.bank.api.model.User;
import com.bank.api.model.Account;
import com.bank.api.model.Branch;
import com.bank.api.repository.UserRepository;
import com.bank.api.repository.AccountRepository;
import com.bank.api.repository.BranchRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final BranchRepository branchRepository;

    public DataInitializer(UserRepository userRepository, AccountRepository accountRepository, BranchRepository branchRepository) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.branchRepository = branchRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            Branch hq = branchRepository.save(new Branch("Headquarters", "Mumbai"));

            User customer = userRepository.save(new User("customer", "password", "ROLE_CUSTOMER", hq));
            userRepository.save(new User("teller", "password", "ROLE_TELLER", hq));
            userRepository.save(new User("branch_manager", "password", "ROLE_BRANCH_MANAGER", hq));
            userRepository.save(new User("compliance", "password", "ROLE_COMPLIANCE_OFFICER"));
            userRepository.save(new User("it_admin", "password", "ROLE_IT_ADMIN"));
            userRepository.save(new User("superadmin", "password", "ROLE_SUPER_ADMIN"));
            
            Account acc1 = accountRepository.save(new Account("1000000001", customer, new BigDecimal("50000.00")));
            Account acc2 = accountRepository.save(new Account("1000000002", customer, new BigDecimal("5000.00")));
        }
    }
}
