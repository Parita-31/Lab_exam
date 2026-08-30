package com.first.labexam.dto;

import java.util.Map;

public class SubmitExamRequest {

    private Long studentId;
    private Long examId;
    // Map of question index or question ID string to user's chosen answer string/option label
    private Map<String, String> answers;

    public SubmitExamRequest() {
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getExamId() {
        return examId;
    }

    public void setExamId(Long examId) {
        this.examId = examId;
    }

    public Map<String, String> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<String, String> answers) {
        this.answers = answers;
    }
}
