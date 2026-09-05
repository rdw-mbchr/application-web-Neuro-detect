package com.neurodetect.backend.repository;

import com.neurodetect.backend.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findAllByOrderByCreatedAtDesc();
    void deleteAllByAnalysisIdIn(List<Long> analysisIds);
    long countByAnalysis_Patient_Id(Long patientId);
}
