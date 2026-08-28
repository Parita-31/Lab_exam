package com.first.labexam.service;

import com.first.labexam.dto.LoginRequest;
import com.first.labexam.dto.LoginResponse;
import com.first.labexam.entity.User;
import com.first.labexam.repository.UserRepository;
import com.first.labexam.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

        // Check account status
        if (user.getStatus() == null ||
                !user.getStatus().equalsIgnoreCase("ACTIVE")) {

            throw new RuntimeException("User account is inactive");
        }

        // Check password
        if (user.getPassword() == null ||
                !passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                )) {

            throw new RuntimeException("Invalid credentials");
        }

        // Generate JWT token
        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole()
        );

        // Return login response
        return new LoginResponse(
                token,
                user.getRole(),
                user.getName(),
                user.getId()
        );
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