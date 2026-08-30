package com.first.labexam.controller;

import com.first.labexam.dto.ChangePasswordRequest;
import com.first.labexam.dto.ExamSummaryResponse;
import com.first.labexam.dto.ProfessorDashboardResponse;
import com.first.labexam.dto.StudentAnswerPaperDTO;
import com.first.labexam.dto.StudentSubmissionSummaryDTO;
import com.first.labexam.dto.UpdateProfileRequest;
import com.first.labexam.dto.UserProfileResponse;
import com.first.labexam.service.ExamService;
import com.first.labexam.service.ProfessorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/professor")
@CrossOrigin(origins = "http://localhost:5173")
public class ProfessorController {

    private final ProfessorService professorService;
    private final ExamService examService;

    public ProfessorController(
            ProfessorService professorService,
            ExamService examService
    ) {
        this.professorService = professorService;
        this.examService = examService;
    }

    @GetMapping("/dashboard/{professorId}")
    public ProfessorDashboardResponse dashboard(
            @PathVariable Long professorId
    ) {
        return professorService.getDashboard(professorId);
    }

    @GetMapping("/profile/{professorId}")
    public ResponseEntity<UserProfileResponse> getProfile(
            @PathVariable Long professorId
    ) {
        return ResponseEntity.ok(professorService.getProfile(professorId));
    }

    @PutMapping("/profile/{professorId}")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @PathVariable Long professorId,
            @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(professorService.updateProfile(professorId, request));
    }

    @PutMapping("/change-password/{professorId}")
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable Long professorId,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        professorService.changePassword(professorId, request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @GetMapping("/{professorId}/exams")
    public List<ExamSummaryResponse> exams(
            @PathVariable Long professorId,
            @RequestParam(required = false) String status
    ) {
        return examService.listForProfessor(professorId, status);
    }

    @GetMapping("/{professorId}/submissions")
    public ResponseEntity<List<StudentSubmissionSummaryDTO>> getSubmissions(
            @PathVariable Long professorId
    ) {
        return ResponseEntity.ok(professorService.getSubmissionsForProfessor(professorId));
    }

    @GetMapping("/{professorId}/exams/{examId}/student/{studentId}/paper")
    public ResponseEntity<StudentAnswerPaperDTO> getStudentAnswerPaper(
            @PathVariable Long professorId,
            @PathVariable Long examId,
            @PathVariable Long studentId
    ) {
        return ResponseEntity.ok(professorService.getStudentAnswerPaper(examId, studentId, professorId));
    }
}