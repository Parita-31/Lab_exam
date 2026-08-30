package com.first.labexam.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class SaveAttendanceRequest {

    @NotEmpty(message = "At least one student attendance mark is required")
    @Valid
    private List<StudentAttendanceMarkRequest> marks;

    public SaveAttendanceRequest() {
    }

    public List<StudentAttendanceMarkRequest> getMarks() {
        return marks;
    }

    public void setMarks(List<StudentAttendanceMarkRequest> marks) {
        this.marks = marks;
    }
}
