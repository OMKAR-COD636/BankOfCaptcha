package com.bank.api.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_requests")
public class TransactionRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "source_account_id", nullable = false)
    private Account sourceAccount;

    @ManyToOne
    @JoinColumn(name = "dest_account_id", nullable = false)
    private Account destAccount;

    @ManyToOne
    @JoinColumn(name = "initiator_id", nullable = false)
    private User initiator;

    @Column(nullable = false)
    private BigDecimal amount;

    // PENDING, APPROVED, REJECTED
    @Column(nullable = false)
    private String status;

    private LocalDateTime createdAt;

    public TransactionRequest() {}

    public TransactionRequest(Account sourceAccount, Account destAccount, User initiator, BigDecimal amount) {
        this.sourceAccount = sourceAccount;
        this.destAccount = destAccount;
        this.initiator = initiator;
        this.amount = amount;
        this.status = "PENDING";
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Account getSourceAccount() { return sourceAccount; }
    public void setSourceAccount(Account sourceAccount) { this.sourceAccount = sourceAccount; }
    public Account getDestAccount() { return destAccount; }
    public void setDestAccount(Account destAccount) { this.destAccount = destAccount; }
    public User getInitiator() { return initiator; }
    public void setInitiator(User initiator) { this.initiator = initiator; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
