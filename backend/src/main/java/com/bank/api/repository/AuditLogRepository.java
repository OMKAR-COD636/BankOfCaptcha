package com.bank.api.repository;

import com.bank.api.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findAllByOrderByTimestampDesc();

    /** Returns audit events that occurred after the given cutoff timestamp, ordered newest-first. */
    List<AuditLog> findByTimestampAfterOrderByTimestampDesc(LocalDateTime cutoff);

    /**
     * Returns the most recent N audit events for a specific user, ordered newest-first.
     * Used by the AI engine's "last N requests" clamp.
     */
    @Query(value = "SELECT * FROM audit_logs WHERE username = :username ORDER BY timestamp DESC LIMIT :limit", nativeQuery = true)
    List<AuditLog> findRecentByUsername(@Param("username") String username, @Param("limit") int limit);
}
