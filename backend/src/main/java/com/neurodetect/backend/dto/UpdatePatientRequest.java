package com.neurodetect.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdatePatientRequest {
    @NotBlank
    private String firstName;
    @NotBlank
    private String lastName;
    private LocalDate dateOfBirth;
    private String gender;
    private String cin;
    private String phone;
    private String address;
    private String notes;
}
