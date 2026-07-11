package com.bank.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Stores the public component and encrypted private component of a prototype PQC key pair.
 * Production deployments should keep private keys in a KMS or HSM instead of the application DB.
 */
@Entity
@Table(name = "pqc_key_material")
public class PqcKeyMaterial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String keyName;

    @Column(nullable = false)
    private String algorithm;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String publicKey;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String encryptedPrivateKey;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public PqcKeyMaterial() {}

    public PqcKeyMaterial(String keyName, String algorithm, String publicKey, String encryptedPrivateKey) {
        this.keyName = keyName;
        this.algorithm = algorithm;
        this.publicKey = publicKey;
        this.encryptedPrivateKey = encryptedPrivateKey;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getKeyName() { return keyName; }
    public String getAlgorithm() { return algorithm; }
    public String getPublicKey() { return publicKey; }
    public String getEncryptedPrivateKey() { return encryptedPrivateKey; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
