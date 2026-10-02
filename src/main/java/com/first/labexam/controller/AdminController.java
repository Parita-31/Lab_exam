package com.first.labexam.controller;

import com.first.labexam.dto.CreateHodRequest;
import com.first.labexam.dto.UpdateHodRequest;
import com.first.labexam.dto.UserProfileResponse;
import com.first.labexam.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // --- HOD MANAGEMENT ---

    @PostMapping("/hods")
    public ResponseEntity<UserProfileResponse> createHod(@Valid @RequestBody CreateHodRequest request) {
        return ResponseEntity.ok(adminService.createHod(request));
    }

    @GetMapping("/hods")
    public ResponseEntity<List<UserProfileResponse>> getAllHods() {
        return ResponseEntity.ok(adminService.getAllHods());
    }

    @PutMapping("/hods/{hodId}")
    public ResponseEntity<UserProfileResponse> updateHod(
            @PathVariable Long hodId,
            @RequestBody UpdateHodRequest request
    ) {
        return ResponseEntity.ok(adminService.updateHod(hodId, request));
    }

    @DeleteMapping("/hods/{hodId}")
    public ResponseEntity<Map<String, String>> deleteHod(@PathVariable Long hodId) {
        adminService.deleteHod(hodId);
        return ResponseEntity.ok(Map.of("message", "HOD deleted successfully"));
    }

    // --- PROFESSOR MANAGEMENT (VIEW & DELETE ONLY) ---

    @GetMapping("/professors")
    public ResponseEntity<List<UserProfileResponse>> getAllProfessors() {
        return ResponseEntity.ok(adminService.getAllProfessors());
    }

    @DeleteMapping("/professors/{professorId}")
    public ResponseEntity<Map<String, String>> deleteProfessor(@PathVariable Long professorId) {
        adminService.deleteProfessor(professorId);
        return ResponseEntity.ok(Map.of("message", "Professor deleted successfully"));
    }

    // --- STUDENT MANAGEMENT (VIEW & DELETE ONLY) ---

    @GetMapping("/students")
    public ResponseEntity<List<UserProfileResponse>> getAllStudents() {
        return ResponseEntity.ok(adminService.getAllStudents());
    }

    @DeleteMapping("/students/{studentId}")
    public ResponseEntity<Map<String, String>> deleteStudent(@PathVariable Long studentId) {
        adminService.deleteStudent(studentId);
        return ResponseEntity.ok(Map.of("message", "Student deleted successfully"));
    }
}
