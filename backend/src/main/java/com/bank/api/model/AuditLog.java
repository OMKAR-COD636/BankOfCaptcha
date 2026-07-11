package com.bank.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String action;
    private LocalDateTime timestamp;

    /** The canonical audit event, encrypted with AES-GCM using an ML-KEM derived key. */
    @Column(name = "encrypted_payload", columnDefinition = "TEXT")
    private String encryptedPayload;

    /** ML-KEM-768 encapsulation needed to derive the AES-GCM key. */
    @Column(name = "kem_encapsulation", columnDefinition = "TEXT")
    private String kemEncapsulation;

    /** ML-DSA-65 signature over the canonical audit event. */
    @Column(name = "pqc_signature", columnDefinition = "TEXT")
    private String pqcSignature;

    private String signatureAlgorithm;
    private String encryptionAlgorithm;

    public AuditLog() {}

    public AuditLog(String username, String action, LocalDateTime timestamp) {
        this.username = username;
        this.action = action;
        this.timestamp = timestamp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getEncryptedPayload() { return encryptedPayload; }
    public void setEncryptedPayload(String encryptedPayload) { this.encryptedPayload = encryptedPayload; }
    public String getKemEncapsulation() { return kemEncapsulation; }
    public void setKemEncapsulation(String kemEncapsulation) { this.kemEncapsulation = kemEncapsulation; }
    public String getPqcSignature() { return pqcSignature; }
    public void setPqcSignature(String pqcSignature) { this.pqcSignature = pqcSignature; }
    public String getSignatureAlgorithm() { return signatureAlgorithm; }
    public void setSignatureAlgorithm(String signatureAlgorithm) { this.signatureAlgorithm = signatureAlgorithm; }
    public String getEncryptionAlgorithm() { return encryptionAlgorithm; }
    public void setEncryptionAlgorithm(String encryptionAlgorithm) { this.encryptionAlgorithm = encryptionAlgorithm; }
}
