package com.neurodetect.backend.controller;

import com.neurodetect.backend.dto.ReportDTO;
import com.neurodetect.backend.security.UserPrincipal;
import com.neurodetect.backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/{analysisId}")
    @PreAuthorize("hasRole('MEDECIN')")
    public ResponseEntity<ReportDTO> generateReport(
            @PathVariable Long analysisId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.generateReport(analysisId, principal));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasRole('MEDECIN')")
    public ResponseEntity<byte[]> downloadReport(@PathVariable Long id) {
        ReportDTO meta  = reportService.getReport(id);
        byte[]    bytes = reportService.downloadReport(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename(meta.getFileName())
                        .build());
        headers.setContentLength(bytes.length);
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
    public ResponseEntity<ReportDTO> getReport(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getReport(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MEDECIN', 'ADMIN')")
    public ResponseEntity<List<ReportDTO>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }
}
