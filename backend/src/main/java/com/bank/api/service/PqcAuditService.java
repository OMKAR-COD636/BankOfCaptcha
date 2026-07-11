package com.bank.api.service;

import com.bank.api.model.AuditLog;
import com.bank.api.model.PqcKeyMaterial;
import com.bank.api.repository.AuditLogRepository;
import com.bank.api.repository.PqcKeyMaterialRepository;
import org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.bouncycastle.crypto.SecretWithEncapsulation;
import org.bouncycastle.pqc.crypto.mldsa.*;
import org.bouncycastle.pqc.crypto.mlkem.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Base64;

/**
 * Protects audit evidence using NIST PQC algorithms. ML-DSA-65 signs the canonical event;
 * ML-KEM-768 derives a per-event AES-256-GCM encryption key.
 */
@Service
public class PqcAuditService {
    private static final String SIGNING_KEY = "audit-signing-ml-dsa-65";
    private static final String ENCRYPTION_KEY = "audit-encryption-ml-kem-768";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int GCM_TAG_BITS = 128;
    private static final int GCM_IV_BYTES = 12;

    private final AuditLogRepository auditLogRepository;
    private final PqcKeyMaterialRepository keyMaterialRepository;
    private final byte[] masterKey;

    public PqcAuditService(AuditLogRepository auditLogRepository,
                           PqcKeyMaterialRepository keyMaterialRepository,
                           @Value("${app.pqc.master-key}") String masterKey) {
        this.auditLogRepository = auditLogRepository;
        this.keyMaterialRepository = keyMaterialRepository;
        this.masterKey = sha256(masterKey.getBytes(StandardCharsets.UTF_8));
    }

    public AuditLog record(String username, String action, LocalDateTime timestamp) {
        byte[] canonicalEvent = canonicalEvent(username, action, timestamp).getBytes(StandardCharsets.UTF_8);
        SecretWithEncapsulation kemSecret = new MLKEMGenerator(RANDOM).generateEncapsulated(getKemPublicKey());
        byte[] aesKey = kemSecret.getSecret();

        try {
            MLDSASigner signer = new MLDSASigner();
            signer.init(true, getSigningPrivateKey());
            signer.update(canonicalEvent, 0, canonicalEvent.length);

            AuditLog log = new AuditLog(username, action, timestamp);
            log.setEncryptedPayload(encrypt(canonicalEvent, aesKey));
            log.setKemEncapsulation(Base64.getEncoder().encodeToString(kemSecret.getEncapsulation()));
            log.setPqcSignature(Base64.getEncoder().encodeToString(signer.generateSignature()));
            log.setSignatureAlgorithm("ML-DSA-65");
            log.setEncryptionAlgorithm("ML-KEM-768 + AES-256-GCM");
            return auditLogRepository.save(log);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to secure audit event", exception);
        } finally {
            Arrays.fill(aesKey, (byte) 0);
            try {
                kemSecret.destroy();
            } catch (Exception ignored) {
                // Best effort cleanup of ephemeral key material.
            }
        }
    }

    public VerificationResult verify(AuditLog log) {
        if (log.getEncryptedPayload() == null || log.getKemEncapsulation() == null || log.getPqcSignature() == null) {
            return new VerificationResult(false, "This legacy audit entry has no PQC protection.", null);
        }

        byte[] aesKey = null;
        try {
            byte[] encapsulation = Base64.getDecoder().decode(log.getKemEncapsulation());
            aesKey = new MLKEMExtractor(getKemPrivateKey()).extractSecret(encapsulation);
            String decryptedEvent = new String(decrypt(log.getEncryptedPayload(), aesKey), StandardCharsets.UTF_8);
            String expectedEvent = canonicalEvent(log.getUsername(), log.getAction(), log.getTimestamp());

            MLDSASigner verifier = new MLDSASigner();
            verifier.init(false, getSigningPublicKey());
            byte[] eventBytes = decryptedEvent.getBytes(StandardCharsets.UTF_8);
            verifier.update(eventBytes, 0, eventBytes.length);
            boolean signatureValid = verifier.verifySignature(Base64.getDecoder().decode(log.getPqcSignature()));

            if (!signatureValid) {
                return new VerificationResult(false, "ML-DSA signature validation failed.", null);
            }
            if (!MessageDigest.isEqual(decryptedEvent.getBytes(StandardCharsets.UTF_8), expectedEvent.getBytes(StandardCharsets.UTF_8))) {
                return new VerificationResult(false, "The encrypted evidence does not match the visible audit metadata.", null);
            }
            return new VerificationResult(true, "PQC signature and encrypted evidence are valid.", decryptedEvent);
        } catch (Exception exception) {
            return new VerificationResult(false, "Verification failed: " + exception.getClass().getSimpleName(), null);
        } finally {
            if (aesKey != null) {
                Arrays.fill(aesKey, (byte) 0);
            }
        }
    }

    private synchronized MLDSAPrivateKeyParameters getSigningPrivateKey() {
        PqcKeyMaterial material = signingMaterial();
        return new MLDSAPrivateKeyParameters(MLDSAParameters.ml_dsa_65,
                decrypt(material.getEncryptedPrivateKey(), masterKey));
    }

    private synchronized MLDSAPublicKeyParameters getSigningPublicKey() {
        PqcKeyMaterial material = signingMaterial();
        return new MLDSAPublicKeyParameters(MLDSAParameters.ml_dsa_65,
                Base64.getDecoder().decode(material.getPublicKey()));
    }

    private synchronized MLKEMPrivateKeyParameters getKemPrivateKey() {
        PqcKeyMaterial material = kemMaterial();
        return new MLKEMPrivateKeyParameters(MLKEMParameters.ml_kem_768,
                decrypt(material.getEncryptedPrivateKey(), masterKey));
    }

    private synchronized MLKEMPublicKeyParameters getKemPublicKey() {
        PqcKeyMaterial material = kemMaterial();
        return new MLKEMPublicKeyParameters(MLKEMParameters.ml_kem_768,
                Base64.getDecoder().decode(material.getPublicKey()));
    }

    private PqcKeyMaterial signingMaterial() {
        return keyMaterialRepository.findByKeyName(SIGNING_KEY).orElseGet(() -> {
            MLDSAKeyPairGenerator generator = new MLDSAKeyPairGenerator();
            generator.init(new MLDSAKeyGenerationParameters(RANDOM, MLDSAParameters.ml_dsa_65));
            AsymmetricCipherKeyPair keyPair = generator.generateKeyPair();
            MLDSAPublicKeyParameters publicKey = (MLDSAPublicKeyParameters) keyPair.getPublic();
            MLDSAPrivateKeyParameters privateKey = (MLDSAPrivateKeyParameters) keyPair.getPrivate();
            return keyMaterialRepository.save(new PqcKeyMaterial(SIGNING_KEY, "ML-DSA-65",
                    Base64.getEncoder().encodeToString(publicKey.getEncoded()),
                    encrypt(privateKey.getEncoded(), masterKey)));
        });
    }

    private PqcKeyMaterial kemMaterial() {
        return keyMaterialRepository.findByKeyName(ENCRYPTION_KEY).orElseGet(() -> {
            MLKEMKeyPairGenerator generator = new MLKEMKeyPairGenerator();
            generator.init(new MLKEMKeyGenerationParameters(RANDOM, MLKEMParameters.ml_kem_768));
            AsymmetricCipherKeyPair keyPair = generator.generateKeyPair();
            MLKEMPublicKeyParameters publicKey = (MLKEMPublicKeyParameters) keyPair.getPublic();
            MLKEMPrivateKeyParameters privateKey = (MLKEMPrivateKeyParameters) keyPair.getPrivate();
            return keyMaterialRepository.save(new PqcKeyMaterial(ENCRYPTION_KEY, "ML-KEM-768",
                    Base64.getEncoder().encodeToString(publicKey.getEncoded()),
                    encrypt(privateKey.getEncoded(), masterKey)));
        });
    }

    private static String canonicalEvent(String username, String action, LocalDateTime timestamp) {
        return username + "\n" + action + "\n" + timestamp;
    }

    private static String encrypt(byte[] plaintext, byte[] key) {
        try {
            byte[] iv = new byte[GCM_IV_BYTES];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext);
            byte[] packed = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, packed, 0, iv.length);
            System.arraycopy(ciphertext, 0, packed, iv.length, ciphertext.length);
            return Base64.getEncoder().encodeToString(packed);
        } catch (Exception exception) {
            throw new IllegalStateException("AES-GCM encryption failed", exception);
        }
    }

    private static byte[] decrypt(String encryptedValue, byte[] key) {
        try {
            byte[] packed = Base64.getDecoder().decode(encryptedValue);
            if (packed.length <= GCM_IV_BYTES) {
                throw new IllegalArgumentException("Invalid encrypted payload");
            }
            byte[] iv = Arrays.copyOfRange(packed, 0, GCM_IV_BYTES);
            byte[] ciphertext = Arrays.copyOfRange(packed, GCM_IV_BYTES, packed.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(GCM_TAG_BITS, iv));
            return cipher.doFinal(ciphertext);
        } catch (Exception exception) {
            throw new IllegalStateException("AES-GCM decryption failed", exception);
        }
    }

    private static byte[] sha256(byte[] value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value);
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    public record VerificationResult(boolean valid, String message, String verifiedPayload) {}
}
