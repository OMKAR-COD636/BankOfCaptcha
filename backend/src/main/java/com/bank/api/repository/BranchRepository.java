package com.bank.api.repository;

import com.bank.api.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BranchRepository extends JpaRepository<Branch, Long> {
    Branch findByBranchId(String branchId);
}
