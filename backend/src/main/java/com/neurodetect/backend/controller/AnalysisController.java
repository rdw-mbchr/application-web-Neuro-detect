package com.neurodetect.backend.controller;

import com.neurodetect.backend.dto.AnalysisDTO;
import com.neurodetect.backend.security.UserPrincipal;
import com.neurodetect.backend.service.AnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/analyses")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('MEDECIN')")
    public ResponseEntity<AnalysisDTO> createAnalysis(
            @RequestParam Long patientId,
            @RequestParam MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(analysisService.createAnalysis(patientId, file, principal));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
    public ResponseEntity<AnalysisDTO> getAnalysis(@PathVariable Long id) {
        return ResponseEntity.ok(analysisService.getAnalysis(id));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
    public ResponseEntity<List<AnalysisDTO>> getPatientAnalyses(@PathVariable Long patientId) {
        return ResponseEntity.ok(analysisService.getPatientAnalyses(patientId));
    }
}
