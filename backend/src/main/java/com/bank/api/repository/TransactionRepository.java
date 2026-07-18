package com.bank.api.repository;

import com.bank.api.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findBySourceAccountIdOrDestAccountId(Long sourceAccountId, Long destAccountId);

    /** Returns all transactions that occurred after the given cutoff timestamp. */
    List<Transaction> findByTimestampAfterOrderByTimestampDesc(LocalDateTime cutoff);
}
