package com.neurodetect.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Map;

@Data
public class AiPredictionResponse {
    private String diagnosis;
    private Double confidence;
    @JsonProperty("all_scores")
    private Map<String, Double> allScores;
    private String mode;
}
