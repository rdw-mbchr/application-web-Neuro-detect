package com.neurodetect.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReportDTO {
    private Long id;
    private Long analysisId;
    private Long patientId;
    private String patientName;
    private String patientCin;
    private String diagnosis;
    private String generatedByName;
    private int reportNumber;
    private String fileName;
    private LocalDateTime createdAt;
}
