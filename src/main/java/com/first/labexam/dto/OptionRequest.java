package com.first.labexam.dto;

public class OptionRequest {

    private String label;

    private String text;

    private Boolean correct = false;


    public OptionRequest() {
    }


    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }


    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }


    public boolean isCorrect() {
        return Boolean.TRUE.equals(correct);
    }

    public void setCorrect(Boolean correct) {
        this.correct = correct != null ? correct : false;
    }
}