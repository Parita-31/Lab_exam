package com.first.labexam.service;

import com.first.labexam.dto.AIGenerateQuestionRequest;
import com.first.labexam.dto.AIGeneratedExamResponse;
import com.first.labexam.dto.AIGeneratedQuestion;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Schema;
import com.google.genai.types.Type;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AIQuestionGenerationService {

    private final Client geminiClient;

    public AIQuestionGenerationService() {
        String apiKey = System.getenv("GEMINI_API_KEY");

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "GEMINI_API_KEY environment variable is not set"
            );
        }

        this.geminiClient = Client.builder()
                .apiKey(apiKey)
                .build();
    }

    public AIGeneratedExamResponse generateQuestions(
            AIGenerateQuestionRequest request) {

        validateRequest(request);

        String prompt = buildPrompt(request);

        GenerateContentConfig config = buildResponseConfig();

        GenerateContentResponse response =
                geminiClient.models.generateContent(
                        "gemini-2.5-flash",
                        prompt,
                        config
                );

        String json = response.text();

        if (json == null || json.isBlank()) {
            throw new RuntimeException(
                    "Gemini returned an empty response"
            );
        }

        return parseResponse(json);
    }

    private String buildPrompt(
            AIGenerateQuestionRequest request) {

        StringBuilder prompt = new StringBuilder();

        prompt.append("""
        You are an expert university practical examination question generator.

        Generate high-quality questions for the given subject.

        STRICT REQUIREMENTS:
        1. Generate exactly the requested number of question sets.
        2. Every set must contain exactly one question for every topic.
        3. Questions from different sets must be different.
        4. Follow the requested question type.
        5. Follow the requested difficulty.
        6. Follow the additional instructions for each topic.
        7. Questions must be suitable for a university practical examination.
        8. Do not include explanations outside the requested JSON structure.
        9. For coding questions, provide a clear programming problem.
        10. For MCQ questions, provide options and exactly one correct answer.
        11. For multiple-choice questions, provide options and the correct answer.
        12. For descriptive/scenario questions, provide a suitable model answer.
        13. Keep questions practical and avoid duplicate wording.

        14. For programming pattern questions, ALWAYS show the expected output
            pattern visually using multiple lines.
        15. Never represent a programming pattern as one continuous string.
        16. Preserve spaces, indentation, line breaks, and alignment in the
            expected output.
        17. Clearly label the expected output as "Expected Output:".
        18. Put the expected output inside a code block.
        """);

        prompt.append(request.getSubject());

        prompt.append("\n\nNumber of sets: ");
        prompt.append(request.getNumberOfSets());

        prompt.append("\n\nTopics:\n");

        int topicNumber = 1;

        for (AIGenerateQuestionRequest.AITopicRequest topic
                : request.getTopics()) {

            prompt.append("\nTopic ")
                    .append(topicNumber++)
                    .append(":\n");

            prompt.append("Name: ")
                    .append(topic.getName())
                    .append("\n");

            prompt.append("Question Type: ")
                    .append(topic.getQuestionType())
                    .append("\n");

            prompt.append("Difficulty: ")
                    .append(topic.getDifficulty())
                    .append("\n");

            if (topic.getInstructions() != null
                    && !topic.getInstructions().isBlank()) {

                prompt.append("Additional Instructions: ")
                        .append(topic.getInstructions())
                        .append("\n");
            }
        }

        return prompt.toString();
    }

    private GenerateContentConfig buildResponseConfig() {

        Schema optionSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(
                        ImmutableMap.of(
                                "label",
                                Schema.builder()
                                        .type(Type.Known.STRING)
                                        .build(),

                                "text",
                                Schema.builder()
                                        .type(Type.Known.STRING)
                                        .build(),

                                "correct",
                                Schema.builder()
                                        .type(Type.Known.BOOLEAN)
                                        .build()
                        )
                )
                .required("label", "text", "correct")
                .build();

        Schema questionSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(
                        ImmutableMap.of(
                                "setNumber",
                                Schema.builder()
                                        .type(Type.Known.INTEGER)
                                        .build(),

                                "topic",
                                Schema.builder()
                                        .type(Type.Known.STRING)
                                        .build(),

                                "question",
                                Schema.builder()
                                        .type(Type.Known.STRING)
                                        .build(),

                                "questionType",
                                Schema.builder()
                                        .type(Type.Known.STRING)
                                        .build(),

                                "difficulty",
                                Schema.builder()
                                        .type(Type.Known.STRING)
                                        .build(),

                                "correctAnswer",
                                Schema.builder()
                                        .type(Type.Known.STRING)
                                        .build(),

                                "options",
                                Schema.builder()
                                        .type(Type.Known.ARRAY)
                                        .items(optionSchema)
                                        .build()
                        )
                )
                .required(
                        "setNumber",
                        "topic",
                        "question",
                        "questionType",
                        "difficulty",
                        "correctAnswer",
                        "options"
                )
                .build();

        Schema responseSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(
                        ImmutableMap.of(
                                "questions",
                                Schema.builder()
                                        .type(Type.Known.ARRAY)
                                        .items(questionSchema)
                                        .build()
                        )
                )
                .required("questions")
                .build();

        return GenerateContentConfig.builder()
                .responseMimeType("application/json")
                .responseSchema(responseSchema)
                .candidateCount(1)
                .build();
    }

    private AIGeneratedExamResponse parseResponse(
            String json) {

        /*
         * Gemini returns valid JSON because we requested
         * application/json with a response schema.
         *
         * Jackson is already available through Spring Boot,
         * so we use it to convert the JSON into our DTO.
         */

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                    new com.fasterxml.jackson.databind.ObjectMapper();

            return mapper.readValue(
                    json,
                    AIGeneratedExamResponse.class
            );

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to parse Gemini response: "
                            + e.getMessage(),
                    e
            );
        }
    }

    private void validateRequest(
            AIGenerateQuestionRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Request cannot be null"
            );
        }

        if (request.getSubject() == null
                || request.getSubject().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Subject is required"
            );
        }

        if (request.getNumberOfSets() == null
                || request.getNumberOfSets() < 1
                || request.getNumberOfSets() > 20) {

            throw new IllegalArgumentException(
                    "Number of sets must be between 1 and 20"
            );
        }

        if (request.getTopics() == null
                || request.getTopics().isEmpty()) {

            throw new IllegalArgumentException(
                    "At least one topic is required"
            );
        }

        for (AIGenerateQuestionRequest.AITopicRequest topic
                : request.getTopics()) {

            if (topic.getName() == null
                    || topic.getName().trim().isEmpty()) {

                throw new IllegalArgumentException(
                        "Topic name cannot be empty"
                );
            }
        }
    }
}