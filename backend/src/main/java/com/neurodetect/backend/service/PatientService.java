package com.neurodetect.backend.service;

import com.neurodetect.backend.dto.*;
import com.neurodetect.backend.entity.Analysis;
import com.neurodetect.backend.entity.Patient;
import com.neurodetect.backend.entity.User;
import com.neurodetect.backend.exception.ApiException;
import com.neurodetect.backend.repository.AnalysisRepository;
import com.neurodetect.backend.repository.PatientRepository;
import com.neurodetect.backend.repository.ReportRepository;
import com.neurodetect.backend.repository.UserRepository;
import com.neurodetect.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository  patientRepository;
    private final UserRepository     userRepository;
    private final AnalysisRepository analysisRepository;
    private final ReportRepository   reportRepository;

    public Page<PatientDTO> getPatients(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("lastName", "firstName"));
        Page<Patient> result = (search != null && !search.isBlank())
                ? patientRepository.search(search.trim(), pageable)
                : patientRepository.findAll(pageable);
        return result.map(this::toDTO);
    }

    public PatientDetailDTO getPatient(Long id) {
        return toDetailDTO(findById(id));
    }

    @Transactional
    public PatientDetailDTO createPatient(CreatePatientRequest req, UserPrincipal principal) {
        if (req.getCin() != null && !req.getCin().isBlank()
                && patientRepository.existsByCin(req.getCin())) {
            throw new ApiException(HttpStatus.CONFLICT, "CIN already in use");
        }

        User doctor = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Patient patient = Patient.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .dateOfBirth(req.getDateOfBirth())
                .gender(req.getGender())
                .cin(blank(req.getCin()))
                .phone(blank(req.getPhone()))
                .address(blank(req.getAddress()))
                .notes(blank(req.getNotes()))
                .createdBy(doctor)
                .build();

        return toDetailDTO(patientRepository.save(patient));
    }

    @Transactional
    public PatientDetailDTO updatePatient(Long id, UpdatePatientRequest req) {
        Patient patient = findById(id);

        String newCin = blank(req.getCin());
        if (newCin != null && !newCin.equals(patient.getCin())
                && patientRepository.existsByCin(newCin)) {
            throw new ApiException(HttpStatus.CONFLICT, "CIN already in use");
        }

        patient.setFirstName(req.getFirstName());
        patient.setLastName(req.getLastName());
        patient.setDateOfBirth(req.getDateOfBirth());
        patient.setGender(blank(req.getGender()));
        patient.setCin(newCin);
        patient.setPhone(blank(req.getPhone()));
        patient.setAddress(blank(req.getAddress()));
        patient.setNotes(blank(req.getNotes()));

        return toDetailDTO(patientRepository.save(patient));
    }

    @Transactional
    public void deletePatient(Long id) {
        findById(id); // assert exists

        // 1. Collect analysis IDs for this patient
        List<Long> analysisIds = analysisRepository
                .findByPatientIdOrderByCreatedAtDesc(id)
                .stream().map(Analysis::getId).toList();

        // 2. Delete reports linked to those analyses
        if (!analysisIds.isEmpty()) {
            reportRepository.deleteAllByAnalysisIdIn(analysisIds);
        }

        // 3. Delete analyses
        analysisRepository.deleteAllByPatientId(id);

        // 4. Delete patient
        patientRepository.deleteById(id);
    }

    private Patient findById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Patient not found"));
    }

    /** Returns null for blank/null strings so we store clean nulls in DB. */
    private static String blank(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private PatientDTO toDTO(Patient p) {
        return PatientDTO.builder()
                .id(p.getId())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .dateOfBirth(p.getDateOfBirth())
                .gender(p.getGender())
                .cin(p.getCin())
                .phone(p.getPhone())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private PatientDetailDTO toDetailDTO(Patient p) {
        return PatientDetailDTO.builder()
                .id(p.getId())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .dateOfBirth(p.getDateOfBirth())
                .gender(p.getGender())
                .cin(p.getCin())
                .phone(p.getPhone())
                .address(p.getAddress())
                .notes(p.getNotes())
                .createdByName(p.getCreatedBy() != null ? p.getCreatedBy().getFullName() : null)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
