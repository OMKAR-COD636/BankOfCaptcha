package com.bank.api.repository;

import com.bank.api.model.PqcKeyMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PqcKeyMaterialRepository extends JpaRepository<PqcKeyMaterial, Long> {
    Optional<PqcKeyMaterial> findByKeyName(String keyName);
}
