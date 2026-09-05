package com.neurodetect.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class AnalysisDTO {
    private Long id;
    private Long patientId;
    private String performedByName;
    private String imagePath;
    private String imageFormat;
    private String diagnosis;
    private BigDecimal confidence;
    private Map<String, Double> allScores;
    private String notes;
    private String status;
    private LocalDateTime analyzedAt;
    private LocalDateTime createdAt;
}
