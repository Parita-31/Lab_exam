package com.first.labexam.repository;


import com.first.labexam.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEnrollmentNumber(String enrollmentNumber);

    long countByRole(String role);

    long countByRoleAndBatch(String role, String batch);

    java.util.List<User> findByRole(String role);

    java.util.List<User> findByRoleAndBatch(String role, String batch);

    java.util.List<User> findByRoleAndBatchIgnoreCase(String role, String batch);
}