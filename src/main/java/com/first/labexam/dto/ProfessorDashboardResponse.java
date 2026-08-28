
package com.first.labexam.dto;

import java.util.List;

public class ProfessorDashboardResponse {

    private Long professorId;
    private String name;
    private String email;
    private String department;

    private long totalExams;
    private long draftExams;
    private long activeExamsCount;
    private long upcomingExamsCount;
    private long pastExamsCount;
    private long totalStudents;

    private List<ExamSummaryResponse> activeExams;
    private List<ExamSummaryResponse> upcomingExams;
    private List<ExamSummaryResponse> pastExams;
    private List<ExamSummaryResponse> recentExams;

    public ProfessorDashboardResponse() {
    }

    public Long getProfessorId() {
        return professorId;
    }

    public void setProfessorId(Long professorId) {
        this.professorId = professorId;
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

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public long getTotalExams() {
        return totalExams;
    }

    public void setTotalExams(long totalExams) {
        this.totalExams = totalExams;
    }

    public long getDraftExams() {
        return draftExams;
    }

    public void setDraftExams(long draftExams) {
        this.draftExams = draftExams;
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

    public long getPastExamsCount() {
        return pastExamsCount;
    }

    public void setPastExamsCount(long pastExamsCount) {
        this.pastExamsCount = pastExamsCount;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
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

    public List<ExamSummaryResponse> getRecentExams() {
        return recentExams;
    }

    public void setRecentExams(List<ExamSummaryResponse> recentExams) {
        this.recentExams = recentExams;
    }
}