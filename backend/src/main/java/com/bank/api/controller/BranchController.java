package com.bank.api.controller;

import com.bank.api.model.Branch;
import com.bank.api.model.User;
import com.bank.api.repository.BranchRepository;
import com.bank.api.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/branches")
public class BranchController {
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    public BranchController(BranchRepository branchRepository, UserRepository userRepository) {
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Branch>> getAllBranches() {
        return ResponseEntity.ok(branchRepository.findAll());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createBranch(@RequestBody Branch request) {
        // Only accessible by Super Admin (enforced by Security Config)
        Branch branch = new Branch(request.getName(), request.getLocation());
        branchRepository.save(branch);
        return ResponseEntity.ok(branch);
    }

    @PostMapping("/{branchId}/assign/{userId}")
    public ResponseEntity<?> assignStaff(@PathVariable Long branchId, @PathVariable Long userId) {
        // Only accessible by Super Admin
        Branch branch = branchRepository.findById(branchId).orElse(null);
        User user = userRepository.findById(userId).orElse(null);

        if (branch == null || user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Branch or User not found"));
        }

        user.setBranch(branch);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Staff assigned to branch successfully", "branchId", branch.getBranchId()));
    }
}
