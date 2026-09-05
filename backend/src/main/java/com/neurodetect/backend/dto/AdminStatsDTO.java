package com.neurodetect.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class AdminStatsDTO {
    private long totalPatients;
    private long totalAnalyses;
    private long totalDoctors;
    private long totalReports;
    private List<MonthCount> analysesByMonth;
    private Map<String, Long> diagnosesByClass;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MonthCount {
        private String month;
        private long count;
    }
}
