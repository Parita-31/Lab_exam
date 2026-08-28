package com.first.labexam.controller;

import com.first.labexam.dto.ExamSummaryResponse;
import com.first.labexam.dto.StudentDashboardResponse;
import com.first.labexam.service.ExamService;
import com.first.labexam.service.StudentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/{studentId}/exams")
    public List<ExamSummaryResponse> exams(
            @PathVariable Long studentId,
            @RequestParam(required = false) String status
    ) {
        return examService.listForStudent(studentId, status);
    }

    @GetMapping("/exams/{examId}")
    public com.first.labexam.dto.ExamResponse getExamDetails(
            @PathVariable Long examId
    ) {
        return examService.getExam(examId);
    }
}