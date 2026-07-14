package com.bank.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "kyc_requests")
public class KycRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(nullable = false)
    private String fullName;

    // Encrypted PII
    @Column(nullable = false, columnDefinition = "TEXT")
    private String encryptedAadhaar;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String encryptedMobile;
    
    @Column(nullable = false)
    private String email;

    // PENDING, APPROVED, REJECTED
    @Column(nullable = false)
    private String status;

    private LocalDateTime createdAt;

    public KycRequest() {}

    public KycRequest(User user, Branch branch, String fullName, String encryptedAadhaar, String encryptedMobile, String email) {
        this.user = user;
        this.branch = branch;
        this.fullName = fullName;
        this.encryptedAadhaar = encryptedAadhaar;
        this.encryptedMobile = encryptedMobile;
        this.email = email;
        this.status = "PENDING";
        this.createdAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public User getUser() { return user; }
    public Branch getBranch() { return branch; }
    public String getFullName() { return fullName; }
    public String getEncryptedAadhaar() { return encryptedAadhaar; }
    public void setEncryptedAadhaar(String encryptedAadhaar) { this.encryptedAadhaar = encryptedAadhaar; }
    public String getEncryptedMobile() { return encryptedMobile; }
    public void setEncryptedMobile(String encryptedMobile) { this.encryptedMobile = encryptedMobile; }
    public String getEmail() { return email; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
