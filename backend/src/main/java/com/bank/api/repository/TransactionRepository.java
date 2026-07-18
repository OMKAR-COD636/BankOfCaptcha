package com.bank.api.repository;

import com.bank.api.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findBySourceAccountIdOrDestAccountId(Long sourceAccountId, Long destAccountId);

    /** Returns all transactions that occurred after the given cutoff timestamp. */
    List<Transaction> findByTimestampAfterOrderByTimestampDesc(LocalDateTime cutoff);

    /**
     * Returns the most recent N transactions where the source account belongs to a specific user.
     */
    @Query(value = "SELECT t.* FROM transactions t JOIN accounts a ON t.source_account_id = a.id JOIN users u ON a.user_id = u.id WHERE u.username = :username ORDER BY t.timestamp DESC LIMIT :limit", nativeQuery = true)
    List<Transaction> findRecentByUsername(@org.springframework.data.repository.query.Param("username") String username, @org.springframework.data.repository.query.Param("limit") int limit);
}
