package com.first.labexam.dto;

import java.util.List;

public class AIGeneratedExamResponse {

    private List<AIGeneratedQuestion> questions;

    public List<AIGeneratedQuestion> getQuestions() {
        return questions;
    }

    public void setQuestions(List<AIGeneratedQuestion> questions) {
        this.questions = questions;
    }
}