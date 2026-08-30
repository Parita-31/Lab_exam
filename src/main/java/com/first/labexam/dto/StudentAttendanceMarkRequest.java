package com.first.labexam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class StudentAttendanceMarkRequest {

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotBlank(message = "Attendance status is required")
    private String status;

    public StudentAttendanceMarkRequest() {
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
