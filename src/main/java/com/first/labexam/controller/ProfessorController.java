package com.first.labexam.controller;

import com.first.labexam.dto.ExamSummaryResponse;
import com.first.labexam.dto.ProfessorDashboardResponse;
import com.first.labexam.service.ExamService;
import com.first.labexam.service.ProfessorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/{professorId}/exams")
    public List<ExamSummaryResponse> exams(
            @PathVariable Long professorId,
            @RequestParam(required = false) String status
    ) {
        return examService.listForProfessor(professorId, status);
    }}