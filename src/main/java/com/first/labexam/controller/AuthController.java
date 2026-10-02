package com.first.labexam.controller;
import com.first.labexam.dto.LoginRequest;
import com.first.labexam.dto.LoginResponse;
import com.first.labexam.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.first.labexam.dto.ProfessorRegisterRequest;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {

        return ResponseEntity.ok(
                authService.login(request)
        );
    }

    @PostMapping("/register-professor")
    public ResponseEntity<LoginResponse> registerProfessor(
            @Valid @RequestBody ProfessorRegisterRequest request
    ) {
        return ResponseEntity.ok(
                authService.registerProfessor(request)
        );
    }
}
