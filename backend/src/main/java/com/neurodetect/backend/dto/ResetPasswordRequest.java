package com.neurodetect.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank
    private String currentPassword;
    @NotBlank @Size(min = 8, message = "New password must be at least 8 characters")
    private String newPassword;
}
