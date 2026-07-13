package com.bank.api.repository;

import com.bank.api.model.KycRequest;
import com.bank.api.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface KycRequestRepository extends JpaRepository<KycRequest, Long> {
    List<KycRequest> findByBranchAndStatus(Branch branch, String status);
    List<KycRequest> findByUserId(Long userId);
}
