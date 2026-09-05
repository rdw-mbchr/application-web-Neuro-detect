package com.neurodetect.backend.service;

import com.neurodetect.backend.dto.AiPredictionResponse;
import com.neurodetect.backend.dto.AnalysisDTO;
import com.neurodetect.backend.entity.Analysis;
import com.neurodetect.backend.entity.Patient;
import com.neurodetect.backend.entity.User;
import com.neurodetect.backend.exception.ApiException;
import com.neurodetect.backend.repository.AnalysisRepository;
import com.neurodetect.backend.repository.PatientRepository;
import com.neurodetect.backend.repository.UserRepository;
import com.neurodetect.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final AnalysisRepository analysisRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${app.ai-service.url}")
    private String aiServiceUrl;

    @Transactional
    public AnalysisDTO createAnalysis(Long patientId, MultipartFile file, UserPrincipal principal) {
        String filename = file.getOriginalFilename();
        String lname = filename == null ? "" : filename.toLowerCase();
        if (!lname.endsWith(".nii.gz") && !lname.endsWith(".nii")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only .nii and .nii.gz files are accepted");
        }

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Patient not found"));
        User doctor = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        String savedPath = saveFile(patientId, file);

        AiPredictionResponse ai;
        try {
            ai = callAiService(file);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI service error: " + e.getMessage());
        }

        Analysis analysis = Analysis.builder()
                .patient(patient)
                .performedBy(doctor)
                .imagePath(savedPath)
                .imageFormat("NIFTI")
                .diagnosis(ai.getDiagnosis())
                .confidence(BigDecimal.valueOf(ai.getConfidence()).setScale(4, RoundingMode.HALF_UP))
                .allScores(ai.getAllScores())
                .status("COMPLETED")
                .analyzedAt(LocalDateTime.now())
                .build();

        return toDTO(analysisRepository.save(analysis));
    }

    public AnalysisDTO getAnalysis(Long id) {
        return toDTO(findById(id));
    }

    public List<AnalysisDTO> getPatientAnalyses(Long patientId) {
        return analysisRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private String saveFile(Long patientId, MultipartFile file) {
        try {
            Path dir = Paths.get(uploadDir, "patients", patientId.toString());
            Files.createDirectories(dir);
            String safeName = patientId + "_" + System.currentTimeMillis() + "_"
                    + Objects.requireNonNullElse(file.getOriginalFilename(), "scan.nii.gz");
            Path dest = dir.resolve(safeName);
            file.transferTo(dest.toAbsolutePath());
            return dest.toString();
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save uploaded file");
        }
    }

    private AiPredictionResponse callAiService(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            String filename = Objects.requireNonNullElse(file.getOriginalFilename(), "scan.nii.gz");

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(bytes) {
                @Override
                public String getFilename() { return filename; }
            });

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ResponseEntity<AiPredictionResponse> resp = restTemplate.postForEntity(
                    aiServiceUrl + "/api/v1/predict",
                    new HttpEntity<>(body, headers),
                    AiPredictionResponse.class
            );
            return Objects.requireNonNull(resp.getBody(), "Empty response from AI service");
        } catch (IOException e) {
            throw new RestClientException("Failed to read file bytes: " + e.getMessage());
        }
    }

    private Analysis findById(Long id) {
        return analysisRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Analysis not found"));
    }

    private AnalysisDTO toDTO(Analysis a) {
        return AnalysisDTO.builder()
                .id(a.getId())
                .patientId(a.getPatient().getId())
                .performedByName(a.getPerformedBy() != null ? a.getPerformedBy().getFullName() : null)
                .imagePath(a.getImagePath())
                .imageFormat(a.getImageFormat())
                .diagnosis(a.getDiagnosis())
                .confidence(a.getConfidence())
                .allScores(a.getAllScores())
                .notes(a.getNotes())
                .status(a.getStatus())
                .analyzedAt(a.getAnalyzedAt())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
