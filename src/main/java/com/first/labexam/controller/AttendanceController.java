package com.first.labexam.controller;

import com.first.labexam.dto.ExamAttendanceRosterDTO;
import com.first.labexam.dto.ExamSummaryResponse;
import com.first.labexam.dto.SaveAttendanceRequest;
import com.first.labexam.dto.StudentAttendanceOverviewDTO;
import com.first.labexam.security.AuthContext;
import com.first.labexam.security.CustomUserPrincipal;
import com.first.labexam.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping("/api/professor/attendance/exams")
    public ResponseEntity<List<ExamSummaryResponse>> listProfessorExams() {
        CustomUserPrincipal professor = AuthContext.requireRole("PROFESSOR");
        return ResponseEntity.ok(attendanceService.listProfessorExams(professor));
    }

    @GetMapping("/api/professor/attendance/exams/{examId}")
    public ResponseEntity<ExamAttendanceRosterDTO> getExamAttendance(@PathVariable Long examId) {
        CustomUserPrincipal professor = AuthContext.requireRole("PROFESSOR");
        return ResponseEntity.ok(attendanceService.getExamRoster(examId, professor));
    }

    @PutMapping("/api/professor/attendance/exams/{examId}")
    public ResponseEntity<ExamAttendanceRosterDTO> saveExamAttendance(
            @PathVariable Long examId,
            @Valid @RequestBody SaveAttendanceRequest request
    ) {
        CustomUserPrincipal professor = AuthContext.requireRole("PROFESSOR");
        return ResponseEntity.ok(attendanceService.saveExamAttendance(examId, request, professor));
    }

    @GetMapping("/api/student/attendance")
    public ResponseEntity<StudentAttendanceOverviewDTO> getMyAttendance() {
        CustomUserPrincipal student = AuthContext.requireRole("STUDENT");
        return ResponseEntity.ok(attendanceService.getLoggedInStudentAttendance(student));
    }
}
