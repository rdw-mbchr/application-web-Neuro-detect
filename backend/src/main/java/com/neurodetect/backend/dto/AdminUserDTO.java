package com.neurodetect.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserDTO {
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private Boolean isActive;
    private String phone;
    private LocalDateTime createdAt;
}
