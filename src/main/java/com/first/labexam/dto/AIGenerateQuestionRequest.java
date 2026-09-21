package com.first.labexam.dto;

import java.util.List;

public class AIGenerateQuestionRequest {

    private String subject;
    private Integer numberOfSets;
    private List<AITopicRequest> topics;

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public Integer getNumberOfSets() {
        return numberOfSets;
    }

    public void setNumberOfSets(Integer numberOfSets) {
        this.numberOfSets = numberOfSets;
    }

    public List<AITopicRequest> getTopics() {
        return topics;
    }

    public void setTopics(List<AITopicRequest> topics) {
        this.topics = topics;
    }

    public static class AITopicRequest {

        private String name;
        private String questionType;
        private String difficulty;
        private String instructions;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getQuestionType() {
            return questionType;
        }

        public void setQuestionType(String questionType) {
            this.questionType = questionType;
        }

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }

        public String getInstructions() {
            return instructions;
        }

        public void setInstructions(String instructions) {
            this.instructions = instructions;
        }
    }
}