package com.bank.api.service;

import com.bank.api.model.User;
import com.bank.api.model.Account;
import com.bank.api.repository.UserRepository;
import com.bank.api.repository.AccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    public DataInitializer(UserRepository userRepository, AccountRepository accountRepository) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            User customer = userRepository.save(new User("customer", "password", "ROLE_CUSTOMER"));
            userRepository.save(new User("teller", "password", "ROLE_TELLER"));
            userRepository.save(new User("branch_manager", "password", "ROLE_BRANCH_MANAGER"));
            userRepository.save(new User("compliance", "password", "ROLE_COMPLIANCE_OFFICER"));
            userRepository.save(new User("it_admin", "password", "ROLE_IT_ADMIN"));
            userRepository.save(new User("superadmin", "password", "ROLE_SUPER_ADMIN"));
            
            accountRepository.save(new Account("1000000001", customer, new BigDecimal("1500.00")));
        }
    }
}
