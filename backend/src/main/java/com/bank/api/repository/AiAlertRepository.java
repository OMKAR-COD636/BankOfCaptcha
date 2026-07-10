package com.bank.api.repository;

import com.bank.api.model.AiAlert;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiAlertRepository extends JpaRepository<AiAlert, Long> {
}
