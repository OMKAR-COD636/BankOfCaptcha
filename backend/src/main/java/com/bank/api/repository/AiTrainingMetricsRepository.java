package com.bank.api.repository;

import com.bank.api.model.AiTrainingMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiTrainingMetricsRepository extends JpaRepository<AiTrainingMetrics, Long> {
}
