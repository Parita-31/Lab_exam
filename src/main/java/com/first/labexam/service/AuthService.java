package com.first.labexam.service;

import com.first.labexam.dto.LoginRequest;
import com.first.labexam.dto.LoginResponse;
import com.first.labexam.dto.ProfessorRegisterRequest;
import com.first.labexam.entity.User;
import com.first.labexam.repository.UserRepository;
import com.first.labexam.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public LoginResponse registerProfessor(ProfessorRegisterRequest request) {
        if (request == null) {
            throw new RuntimeException("Registration request cannot be null");
        }

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }

        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already registered in the system");
        }

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Name is required");
        }

        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters long");
        }

        if (request.getDepartment() == null || request.getDepartment().trim().isEmpty()) {
            throw new RuntimeException("Department is required");
        }

        User professor = new User();
        professor.setName(request.getName().trim());
        professor.setEmail(email);
        professor.setPassword(passwordEncoder.encode(request.getPassword()));
        professor.setRole("PROFESSOR");
        professor.setDepartment(request.getDepartment().trim());
        professor.setStatus("PENDING");

        User saved = userRepository.save(professor);

        LoginResponse response = new LoginResponse();
        response.setUserId(saved.getId());
        response.setName(saved.getName());
        response.setEmail(saved.getEmail());
        response.setRole(saved.getRole());
        response.setDepartment(saved.getDepartment());
        response.setStatus(saved.getStatus());
        response.setDesignation("Associate Professor");
        response.setCreatedAt(saved.getCreatedAt() != null ? saved.getCreatedAt().toString() : null);
        return response;
    }

    public LoginResponse login(LoginRequest request) {

        // Validate request
        if (request == null) {
            throw new RuntimeException("Login request cannot be null");
        }

        if (request.getIdentifier() == null ||
                request.getIdentifier().trim().isEmpty()) {
            throw new RuntimeException("Email or enrollment number is required");
        }

        if (request.getPassword() == null ||
                request.getPassword().isEmpty()) {
            throw new RuntimeException("Password is required");
        }

        // Remove accidental spaces from identifier
        String identifier = request.getIdentifier().trim();

        // Find user by email or enrollment number
        User user = findUser(identifier);

        // Check password first before status, or after status according to application rules
        if (user.getPassword() == null ||
                !passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                )) {

            throw new RuntimeException("Invalid credentials");
        }

        // Check account status with clear user messages
        String status = user.getStatus() != null ? user.getStatus().toUpperCase() : "ACTIVE";
        if ("PENDING".equals(status)) {
            throw new RuntimeException("Your professor account registration is pending HOD approval.");
        } else if ("REJECTED".equals(status)) {
            throw new RuntimeException("Your professor account registration request was rejected by HOD.");
        } else if (!"ACTIVE".equals(status)) {
            throw new RuntimeException("User account is inactive.");
        }

        // Generate JWT token with userId, email and role
        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole()
        );

        // Return login response with full user profile
        LoginResponse response = new LoginResponse(
                token,
                user.getRole(),
                user.getName(),
                user.getId()
        );
        response.setEmail(user.getEmail());
        response.setDepartment(user.getDepartment());
        response.setEnrollmentNumber(user.getEnrollmentNumber());
        response.setBatch(user.getBatch());
        response.setSemester(user.getSemester());
        response.setProfileImage(user.getProfileImage());
        response.setStatus(user.getStatus() != null ? user.getStatus() : "ACTIVE");
        response.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "";
        if ("ADMIN".equals(role)) {
            response.setDesignation("System Administrator");
        } else if ("HOD".equals(role)) {
            response.setDesignation("Head of Department");
        } else if ("PROFESSOR".equals(role)) {
            response.setDesignation("Associate Professor");
        } else {
            response.setDesignation("Student");
        }

        return response;
    }


    private User findUser(String identifier) {

        // Login using email
        if (identifier.contains("@")) {

            return userRepository
                    .findByEmail(identifier)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Invalid credentials"
                            )
                    );
        }

        // Login using enrollment number
        return userRepository
                .findByEnrollmentNumber(identifier)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invalid credentials"
                        )
                );
    }
}