package com.bank.api.repository;

import com.bank.api.model.AiAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiAlertRepository extends JpaRepository<AiAlert, Long> {
    List<AiAlert> findAllByOrderByTimestampDesc();
}
