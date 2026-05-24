package com.neurodetect.backend.repository;

import com.neurodetect.backend.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    @Query("SELECT p FROM Patient p WHERE " +
           "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.lastName)  LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.cin)       LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Patient> search(@Param("q") String query, Pageable pageable);

    boolean existsByCin(String cin);
}
