package com.neurodetect.backend.repository;

import com.neurodetect.backend.entity.Analysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AnalysisRepository extends JpaRepository<Analysis, Long> {
    List<Analysis> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    void deleteAllByPatientId(Long patientId);

    @Query(value = "SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count " +
                   "FROM analyses GROUP BY TO_CHAR(created_at, 'YYYY-MM') ORDER BY month",
           nativeQuery = true)
    List<Object[]> countByMonth();

    @Query("SELECT a.diagnosis, COUNT(a) FROM Analysis a WHERE a.diagnosis IS NOT NULL GROUP BY a.diagnosis")
    List<Object[]> countByDiagnosis();
}
