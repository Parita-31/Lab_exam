package com.first.labexam.controller;

import com.first.labexam.dto.CreateStudentRequest;
import com.first.labexam.dto.UpdateStudentRequest;
import com.first.labexam.dto.UserProfileResponse;
import com.first.labexam.service.HodService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.first.labexam.dto.StudentImportPreviewResponse;
import com.first.labexam.dto.StudentImportRowDTO;
import com.first.labexam.service.StudentImportService;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/hod")
@CrossOrigin(origins = "*")
public class HodController {

    private final HodService hodService;
    private final StudentImportService studentImportService;

    public HodController(HodService hodService, StudentImportService studentImportService) {
        this.hodService = hodService;
        this.studentImportService = studentImportService;
    }

    // --- PROFESSOR APPROVAL WORKFLOW ---

    @GetMapping("/{hodId}/professors/pending")
    public ResponseEntity<List<UserProfileResponse>> getPendingProfessors(@PathVariable Long hodId) {
        return ResponseEntity.ok(hodService.getPendingProfessors(hodId));
    }

    @PostMapping("/{hodId}/professors/{professorId}/approve")
    public ResponseEntity<UserProfileResponse> approveProfessor(
            @PathVariable Long hodId,
            @PathVariable Long professorId
    ) {
        return ResponseEntity.ok(hodService.approveProfessor(hodId, professorId));
    }

    @PostMapping("/{hodId}/professors/{professorId}/reject")
    public ResponseEntity<UserProfileResponse> rejectProfessor(
            @PathVariable Long hodId,
            @PathVariable Long professorId
    ) {
        return ResponseEntity.ok(hodService.rejectProfessor(hodId, professorId));
    }

    @GetMapping("/{hodId}/professors")
    public ResponseEntity<List<UserProfileResponse>> getDepartmentProfessors(@PathVariable Long hodId) {
        return ResponseEntity.ok(hodService.getDepartmentProfessors(hodId));
    }

    @DeleteMapping("/{hodId}/professors/{professorId}")
    public ResponseEntity<Map<String, String>> deleteDepartmentProfessor(
            @PathVariable Long hodId,
            @PathVariable Long professorId
    ) {
        hodService.deleteDepartmentProfessor(hodId, professorId);
        return ResponseEntity.ok(Map.of("message", "Department professor deleted successfully"));
    }

    // --- DEPARTMENT STUDENT MANAGEMENT ---

    @PostMapping("/{hodId}/students")
    public ResponseEntity<UserProfileResponse> addStudent(
            @PathVariable Long hodId,
            @Valid @RequestBody CreateStudentRequest request
    ) {
        return ResponseEntity.ok(hodService.addStudent(hodId, request));
    }

    @GetMapping("/{hodId}/students")
    public ResponseEntity<List<UserProfileResponse>> getDepartmentStudents(@PathVariable Long hodId) {
        return ResponseEntity.ok(hodService.getDepartmentStudents(hodId));
    }

    @PutMapping("/{hodId}/students/{studentId}")
    public ResponseEntity<UserProfileResponse> updateDepartmentStudent(
            @PathVariable Long hodId,
            @PathVariable Long studentId,
            @RequestBody UpdateStudentRequest request
    ) {
        return ResponseEntity.ok(hodService.updateDepartmentStudent(hodId, studentId, request));
    }

    @DeleteMapping("/{hodId}/students/{studentId}")
    public ResponseEntity<Map<String, String>> deleteDepartmentStudent(
            @PathVariable Long hodId,
            @PathVariable Long studentId
    ) {
        hodService.deleteDepartmentStudent(hodId, studentId);
        return ResponseEntity.ok(Map.of("message", "Department student deleted successfully"));
    }

    // --- BULK STUDENT IMPORT ---

    @PostMapping("/{hodId}/students/import/preview")
    public ResponseEntity<StudentImportPreviewResponse> previewStudentImport(
            @PathVariable Long hodId,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(studentImportService.previewImport(hodId, file));
    }

    @PostMapping("/{hodId}/students/import/confirm")
    public ResponseEntity<List<UserProfileResponse>> confirmStudentImport(
            @PathVariable Long hodId,
            @RequestBody List<StudentImportRowDTO> rows
    ) {
        return ResponseEntity.ok(studentImportService.confirmImport(hodId, rows));
    }
}
