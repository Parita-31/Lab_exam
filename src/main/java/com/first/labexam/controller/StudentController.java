package com.first.labexam.controller;

import com.first.labexam.dto.ChangePasswordRequest;
import com.first.labexam.dto.ExamResponse;
import com.first.labexam.dto.ExamSubmissionResponse;
import com.first.labexam.dto.ExamSummaryResponse;
import com.first.labexam.dto.StudentDashboardResponse;
import com.first.labexam.dto.SubmitExamRequest;
import com.first.labexam.dto.UpdateProfileRequest;
import com.first.labexam.dto.UserProfileResponse;
import com.first.labexam.service.ExamService;
import com.first.labexam.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
@CrossOrigin(origins = "http://localhost:5173")
public class StudentController {

    private final StudentService studentService;
    private final ExamService examService;

    public StudentController(
            StudentService studentService,
            ExamService examService
    ) {
        this.studentService = studentService;
        this.examService = examService;
    }

    @GetMapping("/dashboard/{studentId}")
    public StudentDashboardResponse dashboard(
            @PathVariable Long studentId
    ) {
        return studentService.getDashboard(studentId);
    }

    @GetMapping("/profile/{studentId}")
    public ResponseEntity<UserProfileResponse> getProfile(
            @PathVariable Long studentId
    ) {
        return ResponseEntity.ok(studentService.getProfile(studentId));
    }

    @PutMapping("/profile/{studentId}")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @PathVariable Long studentId,
            @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(studentService.updateProfile(studentId, request));
    }

    @PutMapping("/change-password/{studentId}")
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable Long studentId,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        studentService.changePassword(studentId, request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @GetMapping("/{studentId}/exams")
    public List<ExamSummaryResponse> exams(
            @PathVariable Long studentId,
            @RequestParam(required = false) String status
    ) {
        return examService.listForStudent(studentId, status);
    }

    @GetMapping("/exams/{examId}")
    public ExamResponse getExamDetails(
            @PathVariable Long examId
    ) {
        return examService.getExam(examId);
    }

    @PostMapping("/exams/{examId}/start")
    public ResponseEntity<ExamResponse> startExam(
            @PathVariable Long examId,
            @RequestParam Long studentId
    ) {
        return ResponseEntity.ok(studentService.startExamAttempt(examId, studentId));
    }

    @PostMapping("/exams/{examId}/submit")
    public ResponseEntity<ExamSubmissionResponse> submitExam(
            @PathVariable Long examId,
            @RequestBody SubmitExamRequest request
    ) {
        request.setExamId(examId);
        return ResponseEntity.ok(studentService.submitExamAttempt(examId, request));
    }
}