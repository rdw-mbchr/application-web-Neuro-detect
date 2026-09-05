package com.neurodetect.backend.service;

import com.neurodetect.backend.dto.AdminStatsDTO;
import com.neurodetect.backend.dto.AdminUserDTO;
import com.neurodetect.backend.entity.Role;
import com.neurodetect.backend.entity.User;
import com.neurodetect.backend.exception.ApiException;
import com.neurodetect.backend.repository.AnalysisRepository;
import com.neurodetect.backend.repository.PatientRepository;
import com.neurodetect.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository     userRepository;
    private final PatientRepository  patientRepository;
    private final AnalysisRepository analysisRepository;
    private final com.neurodetect.backend.repository.ReportRepository reportRepository;

    public AdminStatsDTO getStats() {
        long totalPatients = patientRepository.count();
        long totalAnalyses = analysisRepository.count();
        long totalDoctors  = userRepository.countByRole(Role.MEDECIN);
        long totalReports  = reportRepository.count();

        List<AdminStatsDTO.MonthCount> analysesByMonth = analysisRepository.countByMonth()
                .stream()
                .map(row -> new AdminStatsDTO.MonthCount(
                        (String) row[0],
                        ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        Map<String, Long> diagnosesByClass = new LinkedHashMap<>();
        analysisRepository.countByDiagnosis()
                .forEach(row -> diagnosesByClass.put((String) row[0], ((Number) row[1]).longValue()));

        return AdminStatsDTO.builder()
                .totalPatients(totalPatients)
                .totalAnalyses(totalAnalyses)
                .totalDoctors(totalDoctors)
                .totalReports(totalReports)
                .analysesByMonth(analysesByMonth)
                .diagnosesByClass(diagnosesByClass)
                .build();
    }

    public Page<AdminUserDTO> getUsers(int page, int size) {
        return userRepository
                .findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()))
                .map(this::toDTO);
    }

    @Transactional
    public AdminUserDTO toggleUserActive(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        user.setIsActive(!Boolean.TRUE.equals(user.getIsActive()));
        return toDTO(userRepository.save(user));
    }

    private AdminUserDTO toDTO(User u) {
        return AdminUserDTO.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .role(u.getRole().name())
                .isActive(u.getIsActive())
                .phone(u.getPhone())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
