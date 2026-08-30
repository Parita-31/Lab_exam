package com.first.labexam.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ExamAttendanceRosterDTO {

    private Long examId;
    private String examTitle;
    private String subject;
    private String batch;
    private LocalDate examDate;
    private int totalStudents;
    private int presentCount;
    private int absentCount;
    private int unmarkedCount;
    private List<ExamAttendanceStudentDTO> students = new ArrayList<>();

    public ExamAttendanceRosterDTO() {
    }

    public Long getExamId() {
        return examId;
    }

    public void setExamId(Long examId) {
        this.examId = examId;
    }

    public String getExamTitle() {
        return examTitle;
    }

    public void setExamTitle(String examTitle) {
        this.examTitle = examTitle;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getBatch() {
        return batch;
    }

    public void setBatch(String batch) {
        this.batch = batch;
    }

    public LocalDate getExamDate() {
        return examDate;
    }

    public void setExamDate(LocalDate examDate) {
        this.examDate = examDate;
    }

    public int getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(int totalStudents) {
        this.totalStudents = totalStudents;
    }

    public int getPresentCount() {
        return presentCount;
    }

    public void setPresentCount(int presentCount) {
        this.presentCount = presentCount;
    }

    public int getAbsentCount() {
        return absentCount;
    }

    public void setAbsentCount(int absentCount) {
        this.absentCount = absentCount;
    }

    public int getUnmarkedCount() {
        return unmarkedCount;
    }

    public void setUnmarkedCount(int unmarkedCount) {
        this.unmarkedCount = unmarkedCount;
    }

    public List<ExamAttendanceStudentDTO> getStudents() {
        return students;
    }

    public void setStudents(List<ExamAttendanceStudentDTO> students) {
        this.students = students;
    }
}
