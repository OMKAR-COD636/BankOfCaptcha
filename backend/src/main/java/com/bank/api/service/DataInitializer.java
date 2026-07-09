package com.bank.api.service;

import com.bank.api.model.User;
import com.bank.api.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;

    public DataInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            userRepository.save(new User("customer", "password", "ROLE_CUSTOMER"));
            userRepository.save(new User("admin", "password", "ROLE_ADMIN"));
            userRepository.save(new User("superadmin", "password", "ROLE_SUPER_ADMIN"));
        }
    }
}
