package com.first.labexam.controller;

import com.first.labexam.dto.CreateExamRequest;
import com.first.labexam.dto.ExamResponse;
import com.first.labexam.dto.ExamSummaryResponse;
import com.first.labexam.service.ExamService;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/professor/exams")
@CrossOrigin(origins = "http://localhost:5173")
public class ExamController {

    private final ExamService examService;


    public ExamController(
            ExamService examService
    ) {
        this.examService = examService;
    }


    @PostMapping
    public ResponseEntity<ExamResponse> createExam(
            @RequestBody CreateExamRequest request
    ) {

        ExamResponse exam = examService.createExam(request);

        return ResponseEntity.ok(exam);
    }


    @PutMapping("/{id}")
    public ResponseEntity<ExamResponse> updateExam(
            @PathVariable Long id,
            @RequestBody CreateExamRequest request
    ) {

        return ResponseEntity.ok(
                examService.updateExam(id, request)
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<ExamResponse> getExam(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                examService.getExam(id)
        );
    }


    @GetMapping
    public ResponseEntity<List<ExamSummaryResponse>> listExams(
            @RequestParam Long professorId,
            @RequestParam(required = false) String status
    ) {

        return ResponseEntity.ok(
                examService.listForProfessor(professorId, status)
        );
    }


    @PostMapping("/{id}/publish")
    public ResponseEntity<ExamResponse> publishExam(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                examService.publishExam(id)
        );
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExam(
            @PathVariable Long id
    ) {

        examService.deleteExam(id);

        return ResponseEntity.noContent().build();
    }
}