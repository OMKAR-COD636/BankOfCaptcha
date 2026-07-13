package com.bank.api.controller;

import com.bank.api.model.User;
import com.bank.api.repository.UserRepository;
import com.bank.api.security.JwtUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.bank.api.model.Branch;
import com.bank.api.model.KycRequest;
import com.bank.api.repository.BranchRepository;
import com.bank.api.repository.KycRequestRepository;

import java.util.Map;
import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final BranchRepository branchRepository;
    private final KycRequestRepository kycRequestRepository;

    public AuthController(UserRepository userRepository, JwtUtils jwtUtils, BranchRepository branchRepository, KycRequestRepository kycRequestRepository) {
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.branchRepository = branchRepository;
        this.kycRequestRepository = kycRequestRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            User user = userOpt.get();
            if (user.isAccessSuspended()) {
                return ResponseEntity.status(403).body(Map.of("error", "Access is suspended pending a security review"));
            }
            String token = jwtUtils.generateJwtToken(user.getUsername(), user.getRole());
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", user.getUsername(),
                    "role", user.getRole()
            ));
        }
        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String username = payload.get("username");
        String password = payload.get("password");
        String branchId = payload.get("branchId");
        
        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }

        Branch branch = branchRepository.findByBranchId(branchId);
        if (branch == null) return ResponseEntity.badRequest().body(Map.of("error", "Invalid branch selected"));

        User newUser = new User(username, password, "ROLE_CUSTOMER");
        userRepository.save(newUser);

        String encryptedAadhaar = "ENC[" + payload.get("aadhaarNumber") + "]"; 
        String encryptedMobile = "ENC[" + payload.get("mobileNumber") + "]";

        KycRequest request = new KycRequest(newUser, branch, payload.get("fullName"), encryptedAadhaar, encryptedMobile, payload.get("email"));
        kycRequestRepository.save(request);

        return ResponseEntity.ok(Map.of("message", "Registration successful. Please login to check KYC status."));
    }
}
