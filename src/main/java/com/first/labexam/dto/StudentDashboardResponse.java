package com.first.labexam.dto;

import java.util.List;

public class StudentDashboardResponse {

    private Long studentId;
    private String name;
    private String email;
    private String enrollmentNumber;
    private String batch;
    private Integer semester;
    private String department;

    private long activeExamsCount;
    private long upcomingExamsCount;
    private long completedExamsCount;

    private List<ExamSummaryResponse> activeExams;
    private List<ExamSummaryResponse> upcomingExams;
    private List<ExamSummaryResponse> pastExams;

    public StudentDashboardResponse() {
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEnrollmentNumber() {
        return enrollmentNumber;
    }

    public void setEnrollmentNumber(String enrollmentNumber) {
        this.enrollmentNumber = enrollmentNumber;
    }

    public String getBatch() {
        return batch;
    }

    public void setBatch(String batch) {
        this.batch = batch;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public long getActiveExamsCount() {
        return activeExamsCount;
    }

    public void setActiveExamsCount(long activeExamsCount) {
        this.activeExamsCount = activeExamsCount;
    }

    public long getUpcomingExamsCount() {
        return upcomingExamsCount;
    }

    public void setUpcomingExamsCount(long upcomingExamsCount) {
        this.upcomingExamsCount = upcomingExamsCount;
    }

    public long getCompletedExamsCount() {
        return completedExamsCount;
    }

    public void setCompletedExamsCount(long completedExamsCount) {
        this.completedExamsCount = completedExamsCount;
    }

    public List<ExamSummaryResponse> getActiveExams() {
        return activeExams;
    }

    public void setActiveExams(List<ExamSummaryResponse> activeExams) {
        this.activeExams = activeExams;
    }

    public List<ExamSummaryResponse> getUpcomingExams() {
        return upcomingExams;
    }

    public void setUpcomingExams(List<ExamSummaryResponse> upcomingExams) {
        this.upcomingExams = upcomingExams;
    }

    public List<ExamSummaryResponse> getPastExams() {
        return pastExams;
    }

    public void setPastExams(List<ExamSummaryResponse> pastExams) {
        this.pastExams = pastExams;
    }
}