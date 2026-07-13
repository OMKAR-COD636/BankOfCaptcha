package com.bank.api.repository;

import com.bank.api.model.TransactionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransactionRequestRepository extends JpaRepository<TransactionRequest, Long> {
    List<TransactionRequest> findByStatus(String status);
}
