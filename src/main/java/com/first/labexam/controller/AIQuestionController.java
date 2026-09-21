package com.first.labexam.controller;

import com.first.labexam.dto.AIGenerateQuestionRequest;
import com.first.labexam.dto.AIGeneratedExamResponse;
import com.first.labexam.service.AIQuestionGenerationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/professor/ai")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://127.0.0.1:5173"
})
public class AIQuestionController {

    private final AIQuestionGenerationService
            aiQuestionGenerationService;

    public AIQuestionController(
            AIQuestionGenerationService aiQuestionGenerationService) {

        this.aiQuestionGenerationService =
                aiQuestionGenerationService;
    }

    @PostMapping("/generate")
    public ResponseEntity<AIGeneratedExamResponse> generateQuestions(
            @RequestBody AIGenerateQuestionRequest request) {

        AIGeneratedExamResponse response =
                aiQuestionGenerationService.generateQuestions(request);

        return ResponseEntity.ok(response);
    }
}